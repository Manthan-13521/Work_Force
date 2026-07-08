"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function getPublicStats() {
  const [activeWorkers, verifiedEmployers, totalHires] = await Promise.all([
    prisma.user.count({ where: { role: "WORKER", status: "ACTIVE" } }),
    prisma.employerProfile.count({ where: { isVerified: true } }),
    prisma.application.count({ where: { status: "HIRED" } }),
  ]);

  return {
    activeWorkers,
    verifiedEmployers,
    totalHires,
  };
}

export async function trackJobView(jobId: string) {
  await prisma.jobView.create({ data: { jobId } });
}

export async function getEmployerAnalytics() {
  const user = await requireAuth(["EMPLOYER"]);

  const [jobs, totalShortlisted, totalHired, totalApplicationsCount] = await Promise.all([
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
    prisma.application.count({ where: { job: { employerId: user.id }, status: "SHORTLISTED" } }),
    prisma.application.count({ where: { job: { employerId: user.id }, status: "HIRED" } }),
    prisma.application.count({ where: { job: { employerId: user.id } } }),
  ]);

  const totalJobs = jobs.length;
  const totalViews = jobs.reduce((sum, j) => sum + j._count.views, 0);
  const totalApplications = totalApplicationsCount;
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
      shortlisted: 0,
      hired: 0,
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
