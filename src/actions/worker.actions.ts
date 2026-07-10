"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { getPaginationParams, buildPaginatedResponse } from "@/lib/pagination";
import { updateWorkerProfileSchema } from "@/lib/schemas";
import { recordAuditEvent } from "@/lib/audit";

export async function updateWorkerProfile(data: {
  trade?: string;
  experienceYears?: number;
  expectedSalary?: number;
  city?: string;
  languages?: string[];
}) {
  const user = await requireAuth(["WORKER"]);

  const parsed = updateWorkerProfileSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  if (parsed.data.city) {
    await prisma.user.update({ where: { id: user.id }, data: { city: parsed.data.city } });
  }

  await prisma.workerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
  });

  revalidateTag("worker-profile", "max");
  await recordAuditEvent({ action: "PROFILE_UPDATED", actorId: user.id, actorRole: "WORKER", resource: "worker_profile", resourceId: user.id, newValues: parsed.data });
  return { success: true };
}

export async function getWorkers(searchParams: URLSearchParams) {
  const { cursor, limit } = getPaginationParams(searchParams);

  const workers = await prisma.workerProfile.findMany({
    where: { isVerified: true },
    select: {
      id: true,
      trade: true,
      experienceYears: true,
      expectedSalary: true,
      languages: true,
      user: { select: { name: true, city: true } },
    },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ experienceYears: "desc" }, { id: "desc" }],
  });

  return buildPaginatedResponse(workers, limit);
}
