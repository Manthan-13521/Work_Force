import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache/cache";
import { cacheKey } from "@/lib/cache/keys";
import { Tags } from "@/lib/cache/tags";
import { TTL } from "@/lib/cache/ttl";
import { computeTrend, type Trend } from "./trends";
import { type HealthScore, calculateEmployerHealth, calculateWorkerHealth, calculatePlatformHealth } from "./scoring";
import { timesMore } from "./formatting";

export interface Insight {
  id: string;
  type: "trend" | "highlight" | "warning" | "tip";
  message: string;
  detail?: string;
  trend?: Trend;
  priority: number;
}

export interface EmployerDashboardInsights {
  applicationTrend: Trend;
  viewTrend: Trend;
  hireTrend: Trend;
  topJob: { title: string; views: number; applications: number } | null;
  worstJob: { title: string; applications: number } | null;
  jobsWithNoApplications: { title: string; id: string }[];
  averageAppsPerJob: number;
  expiringJobs: { title: string; id: string; expiresAt: Date }[];
  creditBurnInsight: string;
  healthScore: HealthScore;
  insights: Insight[];
}

export interface WorkerDashboardInsights {
  applicationSuccessRate: number;
  hiredCount: number;
  totalApplications: number;
  profileHealth: HealthScore;
  insights: Insight[];
}

export interface AdminDashboardInsights {
  userTrend: Trend;
  jobTrend: Trend;
  applicationTrend: Trend;
  hireTrend: Trend;
  revenueTrend: Trend;
  fastestCategory: { category: string; count: number } | null;
  verificationBacklog: number;
  pendingReports: number;
  healthScore: HealthScore;
  insights: Insight[];
}

function now(): Date {
  return new Date();
}

function daysAgo(n: number): Date {
  const d = now();
  d.setDate(d.getDate() - n);
  return d;
}

export async function getEmployerInsights(employerId: string): Promise<EmployerDashboardInsights> {
  return cached(
    cacheKey("insights:employer", employerId),
    () => getEmployerInsightsInner(employerId),
    { freshTtl: TTL.EMPLOYER_INSIGHTS.fresh, staleTtl: TTL.EMPLOYER_INSIGHTS.stale, tags: [Tags.DASHBOARD_EMPLOYER] },
  );
}

async function getEmployerInsightsInner(employerId: string): Promise<EmployerDashboardInsights> {
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [currentJobs, , currentViews, previousViews, currentApplications, previousApplications, currentHires, previousHires, allJobs, credits, profile, expiredSoon, hiresByJob] = await Promise.all([
    prisma.job.count({ where: { employerId, status: "ACTIVE" } }),
    prisma.job.count({ where: { employerId, status: "ACTIVE", createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.jobView.count({ where: { job: { employerId }, viewedAt: { gte: weekAgo } } }),
    prisma.jobView.count({ where: { job: { employerId }, viewedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.application.count({ where: { job: { employerId }, appliedAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { job: { employerId }, appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.application.count({ where: { job: { employerId }, status: "HIRED", appliedAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { job: { employerId }, status: "HIRED", appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.job.findMany({
      where: { employerId },
      select: {
        id: true,
        title: true,
        status: true,
        expiresAt: true,
        _count: { select: { applications: true, views: true } },
      },
    }),
    prisma.jobCredit.findFirst({ where: { employerId }, select: { remaining: true } }),
    prisma.employerProfile.findUnique({ where: { userId: employerId }, select: { isVerified: true } }),
    prisma.job.findMany({
      where: { employerId, status: "ACTIVE", expiresAt: { lte: daysAgo(-7), gte: now(), not: null } },
      select: { id: true, title: true, expiresAt: true },
    }),
    prisma.application.groupBy({
      by: ["jobId", "status"],
      where: { job: { employerId }, status: "HIRED" },
      _count: true,
    }),
  ]) as [
    number, number, number, number, number, number, number, number,
    { id: string; title: string; status: string; expiresAt: Date | null; _count: { applications: number; views: number } }[],
    { remaining: number } | null,
    { isVerified: boolean } | null,
    { id: string; title: string; expiresAt: Date }[],
    { jobId: string; status: string; _count: number }[],
  ];

  const hireCountsByJob: Record<string, number> = {};
  for (const row of hiresByJob) {
    hireCountsByJob[row.jobId] = (hireCountsByJob[row.jobId] || 0) + row._count;
  }

  const applicationsAllTime = allJobs.reduce((s, j) => s + j._count.applications, 0);
  const jobsCount = allJobs.length;
  const averageAppsPerJob = jobsCount > 0 ? Math.round((applicationsAllTime / jobsCount) * 10) / 10 : 0;

  const jobsWithViews = [...allJobs].sort((a, b) => b._count.views - a._count.views);
  const topJob = jobsWithViews.length > 0
    ? { title: jobsWithViews[0].title, views: jobsWithViews[0]._count.views, applications: jobsWithViews[0]._count.applications }
    : null;

  const jobsWithNoApplications = allJobs.filter((j) => j._count.applications === 0 && j.status === "ACTIVE").map((j) => ({ title: j.title, id: j.id }));

  const convertRates = allJobs.filter((j) => j._count.applications > 0).map((j) => ({
    title: j.title,
    rate: (hireCountsByJob[j.id] || 0) / j._count.applications,
  }));
  const worstJob = convertRates.length > 0
    ? convertRates.reduce((min, c) => (c.rate < min.rate ? c : min))
    : null;

  const appTrend = computeTrend(currentApplications, previousApplications, "Applications");
  const viewTrend = computeTrend(currentViews, previousViews, "Job views");
  const hireTrend = computeTrend(currentHires, previousHires, "Hires");

  const creditRemaining = credits?.remaining ?? 0;
  const creditBurnInsight = creditRemaining > 0
    ? `Current balance is sufficient for approximately ${creditRemaining} additional job posting${creditRemaining > 1 ? "s" : ""}.`
    : "No job credits remaining. Purchase credits to post new jobs.";

  const totalHiredAll = Object.values(hireCountsByJob).reduce((s, c) => s + c, 0);

  const healthScore = calculateEmployerHealth({
    isVerified: profile?.isVerified ?? false,
    activeJobs: currentJobs,
    totalApplications: applicationsAllTime,
    totalHired: totalHiredAll,
    reportCount: 0,
  });

  const insights: Insight[] = [];

  insights.push({
    id: "app-trend",
    type: appTrend.direction === "up" ? "trend" : appTrend.direction === "down" ? "warning" : "tip",
    message: appTrend.summary,
    trend: appTrend,
    priority: 1,
  });

  if (topJob) {
    const avgApps = averageAppsPerJob > 0 ? averageAppsPerJob : 1;
    const ratio = topJob.applications / avgApps;
    if (ratio > 1.5) {
      insights.push({
        id: "top-job",
        type: "highlight",
        message: `Your "${topJob.title}" receives ${timesMore(topJob.applications, avgApps)} more applications than your average listing.`,
        priority: 2,
      });
    }
  }

  if (worstJob && worstJob.rate === 0 && convertRates.length > 0) {
    insights.push({
      id: "worst-job",
      type: "warning",
      message: `Consider reviewing "${worstJob.title}" which has received applications but no hires yet.`,
      priority: 3,
    });
  }

  if (jobsWithNoApplications.length > 0) {
    insights.push({
      id: "no-apps",
      type: "warning",
      message: `${jobsWithNoApplications.length} job${jobsWithNoApplications.length > 1 ? "s have" : " has"} received no applications. Consider updating the title or salary.`,
      priority: 4,
    });
  }

  if (expiredSoon.length > 0) {
    insights.push({
      id: "expiring",
      type: "warning",
      message: `${expiredSoon.length} job${expiredSoon.length > 1 ? "s" : ""} expiring soon. Repost to maintain visibility.`,
      priority: 5,
    });
  }

  if (appTrend.direction === "down" && appTrend.confidence !== "low") {
    insights.push({
      id: "app-decline",
      type: "tip",
      message: "Consider promoting your jobs or adjusting salary ranges to attract more applicants.",
      priority: 6,
    });
  }

  return {
    applicationTrend: appTrend,
    viewTrend,
    hireTrend,
    topJob,
    worstJob: worstJob ? { title: worstJob.title, applications: 0 } : null,
    jobsWithNoApplications,
    averageAppsPerJob,
    expiringJobs: expiredSoon,
    creditBurnInsight,
    healthScore,
    insights,
  };
}

export async function getWorkerInsights(workerId: string): Promise<WorkerDashboardInsights> {
  return cached(
    cacheKey("insights:worker", workerId),
    () => getWorkerInsightsInner(workerId),
    { freshTtl: TTL.WORKER_INSIGHTS.fresh, staleTtl: TTL.WORKER_INSIGHTS.stale, tags: [Tags.DASHBOARD_WORKER] },
  );
}

async function getWorkerInsightsInner(workerId: string): Promise<WorkerDashboardInsights> {
  const [applications, profile] = await Promise.all([
    prisma.application.findMany({
      where: { workerId },
      select: { id: true, status: true },
    }),
    prisma.workerProfile.findUnique({
      where: { userId: workerId },
      select: { trade: true, experienceYears: true, expectedSalary: true, photoUrl: true, idDocUrl: true, isVerified: true },
    }),
  ]);

  const totalApplications = applications.length;
  const hiredCount = applications.filter((a) => a.status === "HIRED").length;
  const shortlistedCount = applications.filter((a) => a.status === "SHORTLISTED").length;
  const applicationSuccessRate = totalApplications > 0 ? Math.round((hiredCount / totalApplications) * 100) : 0;

  const profileHealth = calculateWorkerHealth({
    profileComplete: !!(profile?.trade && profile?.experienceYears),
    isVerified: profile?.isVerified ?? false,
    applicationsCount: totalApplications,
    hiredCount,
    hasResume: !!(profile?.idDocUrl),
    trade: profile?.trade,
  });

  const insights: Insight[] = [];

  if (totalApplications === 0) {
    insights.push({
      id: "no-apps",
      type: "tip",
      message: "Start applying to jobs to get hired. Browse available positions in your area.",
      priority: 1,
    });
  } else {
    insights.push({
      id: "success-rate",
      type: applicationSuccessRate > 30 ? "highlight" : "tip",
      message: `Application success rate: ${applicationSuccessRate}% (${hiredCount} hired out of ${totalApplications} application${totalApplications > 1 ? "s" : ""}).`,
      detail: applicationSuccessRate > 30
        ? "Your profile resonates well with employers."
        : "Consider improving your profile to increase your success rate.",
      priority: 1,
    });

    if (shortlistedCount > 0) {
      insights.push({
        id: "shortlisted",
        type: "highlight",
        message: `You have been shortlisted for ${shortlistedCount} position${shortlistedCount > 1 ? "s" : ""}. Follow up with employers.`,
        priority: 2,
      });
    }
  }

  if (!profile?.trade) {
    insights.push({
      id: "add-trade",
      type: "tip",
      message: "Add your trade/skill to appear in employer searches and get discovered.",
      priority: 3,
    });
  }

  if (!profile?.isVerified) {
    insights.push({
      id: "verify-id",
      type: "tip",
      message: "Complete identity verification to build trust with employers and increase your chances.",
      priority: 4,
    });
  }

  return {
    applicationSuccessRate,
    hiredCount,
    totalApplications,
    profileHealth,
    insights,
  };
}

export async function getAdminInsights(): Promise<AdminDashboardInsights> {
  return cached(
    cacheKey("insights:admin"),
    () => getAdminInsightsInner(),
    { freshTtl: TTL.ADMIN_INSIGHTS.fresh, staleTtl: TTL.ADMIN_INSIGHTS.stale, tags: [Tags.DASHBOARD_ADMIN] },
  );
}

async function getAdminInsightsInner(): Promise<AdminDashboardInsights> {
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [[currentUsers, , ], [previousUsers, , ], currentJobs, previousJobs, currentApps, previousApps, currentHires, previousHires, currentRevenue, previousRevenue, jobsByCategory, pendingReports, verificationBacklog] = await Promise.all([
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { role: "WORKER", createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { role: "EMPLOYER", createdAt: { gte: weekAgo } } }),
    ]),
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      prisma.user.count({ where: { role: "WORKER", createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
      prisma.user.count({ where: { role: "EMPLOYER", createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    ]),
    prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.job.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.application.count({ where: { appliedAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.application.count({ where: { status: "HIRED", appliedAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { status: "HIRED", appliedAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS", createdAt: { gte: weekAgo } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS", createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.job.groupBy({ by: ["category"], _count: true, orderBy: { _count: { category: "desc" } }, take: 5 }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.employerProfile.count({ where: { isVerified: false } }),
  ]);

  const fastestCategory = jobsByCategory.length > 0 ? { category: jobsByCategory[0].category || "Uncategorized", count: jobsByCategory[0]._count } : null;

  const userTrend = computeTrend(currentUsers + previousUsers, previousUsers || 1, "New users");
  const jobTrend = computeTrend(currentJobs, previousJobs, "New jobs");
  const appTrend = computeTrend(currentApps, previousApps, "Applications");
  const hireTrend = computeTrend(currentHires, previousHires, "Hires");
  const revenueTrend = computeTrend(currentRevenue._sum.amount || 0, previousRevenue._sum.amount || 0, "Revenue");

  const healthScore = calculatePlatformHealth({
    activeUsers: currentUsers + previousUsers,
    activeJobs: currentJobs + previousJobs,
    totalHires: currentHires + previousHires,
    pendingReports,
    revenueGrowth: revenueTrend.percentage,
  });

  const insights: Insight[] = [];

  insights.push({
    id: "user-growth",
    type: userTrend.direction === "up" ? "highlight" : "warning",
    message: userTrend.summary,
    trend: userTrend,
    priority: 1,
  });

  if (verificationBacklog > 0) {
    insights.push({
      id: "verification",
      type: "warning",
      message: `${verificationBacklog} employer${verificationBacklog > 1 ? "s" : ""} pending verification. Review and approve to grow the platform.`,
      priority: 2,
    });
  }

  if (pendingReports > 0) {
    insights.push({
      id: "reports",
      type: pendingReports <= 3 ? "tip" : "warning",
      message: `${pendingReports} report${pendingReports > 1 ? "s" : ""} need${pendingReports === 1 ? "s" : ""} review.`,
      priority: 3,
    });
  }

  if (fastestCategory) {
    insights.push({
      id: "top-category",
      type: "highlight",
      message: `"${fastestCategory.category}" is the most posted job category with ${fastestCategory.count} listing${fastestCategory.count > 1 ? "s" : ""}.`,
      priority: 4,
    });
  }

  if (revenueTrend.direction === "up" && revenueTrend.confidence !== "low") {
    insights.push({
      id: "revenue-growth",
      type: "highlight",
      message: revenueTrend.summary,
      trend: revenueTrend,
      priority: 5,
    });
  }

  return {
    userTrend,
    jobTrend,
    applicationTrend: appTrend,
    hireTrend,
    revenueTrend,
    fastestCategory,
    verificationBacklog,
    pendingReports,
    healthScore,
    insights,
  };
}
