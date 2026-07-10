/**
 * Application Invariants
 *
 * These assertions certify application integrity:
 * - Each (jobId, workerId) pair is unique
 * - Status transitions follow valid paths
 * - No orphan applications
 */

import type { PrismaClient } from "@prisma/client";

const VALID_TRANSITIONS: Record<string, string[]> = {
  APPLIED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["HIRED", "REJECTED"],
  REJECTED: [],
  HIRED: [],
};

/**
 * Asserts that no duplicate (jobId, workerId) application pairs exist.
 * The schema enforces a @@unique constraint, so this is a safety check
 * that the constraint is active and enforced.
 */
export async function assertUniquePerJobWorker(
  prisma: PrismaClient
): Promise<void> {
  const applications = await prisma.application.findMany({
    select: { jobId: true, workerId: true },
  });

  const seen = new Set<string>();
  const duplicates: Array<{ jobId: string; workerId: string }> = [];

  for (const app of applications) {
    const key = `${app.jobId}:${app.workerId}`;
    if (seen.has(key)) {
      duplicates.push({ jobId: app.jobId, workerId: app.workerId });
    }
    seen.add(key);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `APPLICATION_INVARIANT_FAILED: ${duplicates.length} duplicate application(s) found: ${duplicates.map((d) => `(job ${d.jobId}, worker ${d.workerId})`).join(", ")}`
    );
  }
}

/**
 * Asserts that application status transitions follow valid paths.
 * E.g., you cannot go from REJECTED back to APPLIED.
 */
export async function assertStatusTransitionValid(
  prisma: PrismaClient
): Promise<void> {
  const applications = await prisma.application.findMany({
    orderBy: [{ jobId: "asc" }, { workerId: "asc" }, { appliedAt: "asc" }],
    select: { id: true, jobId: true, workerId: true, status: true, appliedAt: true },
  });

  // Group by (jobId, workerId) and check sequence
  const grouped = new Map<string, typeof applications>();
  for (const app of applications) {
    const key = `${app.jobId}:${app.workerId}`;
    const existing = grouped.get(key) || [];
    existing.push(app);
    grouped.set(key, existing);
  }

  for (const [key, apps] of grouped) {
    for (let i = 1; i < apps.length; i++) {
      const prev = apps[i - 1].status;
      const curr = apps[i].status;
      const allowed = VALID_TRANSITIONS[prev];

      if (allowed && !allowed.includes(curr)) {
        throw new Error(
          `APPLICATION_INVARIANT_FAILED: Invalid status transition for ${key}: ${prev} -> ${curr} (application ${apps[i].id})`
        );
      }
    }
  }
}

/**
 * Asserts that every application references an existing job and an existing worker.
 */
export async function assertNoOrphanApplications(
  prisma: PrismaClient
): Promise<void> {
  const orphanJobs = await prisma.application.findMany({
    where: {
      jobId: { notIn: (await prisma.job.findMany({ select: { id: true } })).map((j) => j.id) },
    },
    select: { id: true, jobId: true },
  });

  if (orphanJobs.length > 0) {
    throw new Error(
      `APPLICATION_INVARIANT_FAILED: ${orphanJobs.length} application(s) reference non-existent jobs: ${orphanJobs.map((a) => a.id).join(", ")}`
    );
  }

  const orphanWorkers = await prisma.application.findMany({
    where: {
      workerId: { notIn: (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id) },
    },
    select: { id: true, workerId: true },
  });

  if (orphanWorkers.length > 0) {
    throw new Error(
      `APPLICATION_INVARIANT_FAILED: ${orphanWorkers.length} application(s) reference non-existent workers: ${orphanWorkers.map((a) => a.id).join(", ")}`
    );
  }
}
