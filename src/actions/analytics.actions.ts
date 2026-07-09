"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { backgroundTasks } from "@/lib/background";
import { cached, cacheKey } from "@/lib/cache";

export async function getPublicStats() {
  return cached(cacheKey("public-stats"), async () => {
    const [activeWorkers, verifiedEmployers, totalHires] = await Promise.all([
      prisma.user.count({ where: { role: "WORKER", status: "ACTIVE" } }),
      prisma.employerProfile.count({ where: { isVerified: true } }),
      prisma.application.count({ where: { status: "HIRED" } }),
    ]);

    return { activeWorkers, verifiedEmployers, totalHires };
  }, { ttl: 300 });
}

export async function trackJobView(jobId: string) {
  await prisma.jobView.create({ data: { jobId } });
  await backgroundTasks.cleanupOldJobViews();
}

export async function getEmployerAnalytics() {
  const user = await requireAuth(["EMPLOYER"]);

  const [jobs, applicationCounts] = await Promise.all([
    prisma.job.findMany({
      where: { employerId: user.id },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { select: { applications: true, views: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.groupBy({
      by: ["jobId", "status"],
      where: { job: { employerId: user.id } },
      _count: true,
    }),
  ]);

  const jobIds = jobs.map((j) => j.id);
  const countsByJob: Record<string, Record<string, number>> = {};
  for (const jobId of jobIds) {
    countsByJob[jobId] = {};
  }
  for (const row of applicationCounts) {
    if (!countsByJob[row.jobId]) countsByJob[row.jobId] = {};
    countsByJob[row.jobId][row.status] = row._count;
  }

  const totalJobs = jobs.length;
  const totalViews = jobs.reduce((sum, j) => sum + j._count.views, 0);
  const totalApplications = jobIds.reduce((sum, id) => {
    const c = countsByJob[id];
    return sum + (c?.APPLIED || 0) + (c?.SHORTLISTED || 0) + (c?.HIRED || 0) + (c?.REJECTED || 0);
  }, 0);
  const totalShortlisted = jobIds.reduce((sum, id) => sum + (countsByJob[id]?.SHORTLISTED || 0), 0);
  const totalHired = jobIds.reduce((sum, id) => sum + (countsByJob[id]?.HIRED || 0), 0);
  const conversionRate = totalApplications > 0 ? ((totalHired / totalApplications) * 100).toFixed(1) : "0";

  return {
    totalJobs,
    totalViews,
    totalApplications,
    totalShortlisted,
    totalHired,
    conversionRate,
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      views: j._count.views,
      applications: j._count.applications,
      shortlisted: countsByJob[j.id]?.SHORTLISTED || 0,
      hired: countsByJob[j.id]?.HIRED || 0,
      status: j.status,
      createdAt: j.createdAt,
    })),
  };
}

export async function getAdminAnalytics() {
  await requireAuth(["ADMIN"]);

  const [totalUsers, totalWorkers, totalEmployers, totalJobs, totalApplications, totalViews, totalHires, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "WORKER" } }),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.job.count(),
    prisma.application.count(),
    prisma.jobView.count(),
    prisma.application.count({ where: { status: "HIRED" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
  ]);

  const jobsByCategory = await prisma.job.groupBy({
    by: ["category"],
    _count: true,
    orderBy: { _count: { category: "desc" } },
    take: 10,
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentApplications = await prisma.application.count({
    where: { appliedAt: { gte: thirtyDaysAgo } },
  });

  return {
    totalUsers,
    totalWorkers,
    totalEmployers,
    totalJobs,
    totalApplications,
    totalViews,
    totalHires,
    totalRevenue: totalRevenue._sum.amount || 0,
    recentApplications,
    jobsByCategory: jobsByCategory.map((j) => ({ category: j.category || "Uncategorized", count: j._count })),
  };
}
