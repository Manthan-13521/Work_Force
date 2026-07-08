"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { updateEmployerProfileSchema } from "@/lib/schemas";

export async function updateEmployerProfile(data: {
  companyName?: string;
  industry?: string;
  gstNumber?: string;
  address?: string;
}) {
  const user = await requireAuth(["EMPLOYER"]);

  const parsed = updateEmployerProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.employerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidateTag("employer-profile", "max");
  return { success: true };
}

export async function getEmployerDashboard() {
  const user = await requireAuth(["EMPLOYER"]);

  const [activeJobs, totalApplicants, recentApplications, credits] = await Promise.all([
    prisma.job.count({ where: { employerId: user.id, status: "ACTIVE" } }),
    prisma.application.count({
      where: { job: { employerId: user.id } },
    }),
    prisma.application.findMany({
      where: { job: { employerId: user.id } },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        job: { select: { title: true } },
        worker: { select: { name: true } },
      },
      orderBy: { appliedAt: "desc" },
      take: 10,
    }),
    prisma.jobCredit.findFirst({
      where: { employerId: user.id },
      select: { remaining: true },
    }),
  ]);

  return { activeJobs, totalApplicants, recentApplications, credits };
}
