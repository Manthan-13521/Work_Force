"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { updateEmployerProfileSchema } from "@/lib/schemas";
import { Tags } from "@/lib/cache";
import { cacheKey } from "@/lib/cache/keys";
import { cached } from "@/lib/cache/cache";
import { TTL } from "@/lib/cache/ttl";
import { recordAuditEvent } from "@/lib/audit";

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
  await recordAuditEvent({ action: "PROFILE_UPDATED", actorId: user.id, actorRole: "EMPLOYER", resource: "employer_profile", resourceId: user.id, newValues: parsed.data });
  return { success: true };
}

export async function getEmployerDashboard() {
  const user = await requireAuth(["EMPLOYER"]);
  return cached(
    cacheKey("dashboard:employer", user.id),
    () => getEmployerDashboardInner(user.id),
    { freshTtl: TTL.EMPLOYER_DASHBOARD.fresh, staleTtl: TTL.EMPLOYER_DASHBOARD.stale, tags: [Tags.DASHBOARD_EMPLOYER, Tags.EMPLOYER(user.id)] },
  );
}

async function getEmployerDashboardInner(employerId: string) {
  const [activeJobs, recentApplications, credits] = await Promise.all([
    prisma.job.count({ where: { employerId, status: "ACTIVE" } }),
    prisma.application.findMany({
      where: { job: { employerId } },
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
      where: { employerId },
      select: { remaining: true },
    }),
  ]);

  return { activeJobs, recentApplications, credits };
}
