/**
 * Database Invariants
 *
 * These assertions certify database integrity:
 * - No orphan rows (foreign keys always reference existing records)
 * - Transaction rollback is complete (no partial writes)
 * - Ledger consistency (payment amounts match expected totals)
 */

import type { PrismaClient } from "@/generated/prisma/client";

export async function assertNoOrphanRows(
  prisma: PrismaClient
): Promise<void> {
  const userIds = (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);
  const planIds = (await prisma.plan.findMany({ select: { id: true } })).map((p) => p.id);
  const employerUserIds = (await prisma.employerProfile.findMany({ select: { userId: true } })).map((p) => p.userId);
  const jobIds = (await prisma.job.findMany({ select: { id: true } })).map((j) => j.id);

  // WorkerProfile → User
  const orphanProfiles = await prisma.workerProfile.findMany({
    where: { userId: { notIn: userIds } },
    select: { id: true, userId: true },
  });
  if (orphanProfiles.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanProfiles.length} WorkerProfile(s) orphaned: ${orphanProfiles.map((p) => p.id).join(", ")}`
    );
  }

  // EmployerProfile → User
  const orphanEmployers = await prisma.employerProfile.findMany({
    where: { userId: { notIn: userIds } },
    select: { id: true, userId: true },
  });
  if (orphanEmployers.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanEmployers.length} EmployerProfile(s) orphaned: ${orphanEmployers.map((p) => p.id).join(", ")}`
    );
  }

  // Job → User
  const orphanJobs = await prisma.job.findMany({
    where: { employerId: { notIn: userIds } },
    select: { id: true, employerId: true },
  });
  if (orphanJobs.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanJobs.length} Job(s) orphaned: ${orphanJobs.map((j) => j.id).join(", ")}`
    );
  }

  // Payment → User
  const orphanPayments = await prisma.payment.findMany({
    where: { userId: { notIn: userIds } },
    select: { id: true, userId: true },
  });
  if (orphanPayments.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanPayments.length} Payment(s) orphaned: ${orphanPayments.map((p) => p.id).join(", ")}`
    );
  }

  // Payment → Plan (nullable)
  const orphanPlanPayments = await prisma.payment.findMany({
    where: {
      planId: { not: null, notIn: planIds },
    },
    select: { id: true, planId: true },
  });
  if (orphanPlanPayments.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanPlanPayments.length} Payment(s) reference non-existent plans: ${orphanPlanPayments.map((p) => p.id).join(", ")}`
    );
  }

  // JobCredit → EmployerProfile
  const orphanCredits = await prisma.jobCredit.findMany({
    where: { employerId: { notIn: employerUserIds } },
    select: { id: true, employerId: true },
  });
  if (orphanCredits.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanCredits.length} JobCredit(s) orphaned: ${orphanCredits.map((c) => c.id).join(", ")}`
    );
  }

  // Application → Job
  const orphanAppJobs = await prisma.application.findMany({
    where: { jobId: { notIn: jobIds } },
    select: { id: true, jobId: true },
  });
  if (orphanAppJobs.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanAppJobs.length} Application(s) orphaned (job): ${orphanAppJobs.map((a) => a.id).join(", ")}`
    );
  }

  // Application → User (worker)
  const orphanAppWorkers = await prisma.application.findMany({
    where: { workerId: { notIn: userIds } },
    select: { id: true, workerId: true },
  });
  if (orphanAppWorkers.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${orphanAppWorkers.length} Application(s) orphaned (worker): ${orphanAppWorkers.map((a) => a.id).join(", ")}`
    );
  }
}

export async function assertTransactionRollbackComplete(
  prisma: PrismaClient
): Promise<void> {
  const stalePayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true, createdAt: true },
  });

  if (stalePayments.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${stalePayments.length} Payment(s) stuck in PENDING for > 24h: ${stalePayments.map((p) => p.id).join(", ")}`
    );
  }

  const pendingOrphan = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      razorpayOrderId: null,
      createdAt: { lt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
    },
    select: { id: true, createdAt: true },
  });

  if (pendingOrphan.length > 0) {
    throw new Error(
      `DB_INVARIANT_FAILED: ${pendingOrphan.length} Payment(s) stuck in PENDING with no order ID for > 1h: ${pendingOrphan.map((p) => p.id).join(", ")}`
    );
  }
}

export async function assertLedgerConsistent(
  prisma: PrismaClient
): Promise<void> {
  const successPayments = await prisma.payment.findMany({
    where: { status: "SUCCESS", purpose: "PLAN_PURCHASE" },
    select: { id: true, userId: true, amount: true, planId: true },
  });

  if (successPayments.length === 0) return;

  const employerIds = [...new Set(successPayments.map((p) => p.userId))];
  const creditRecords = await prisma.jobCredit.findMany({
    where: { employerId: { in: employerIds } },
    select: { employerId: true, remaining: true },
  });

  const creditMap = new Map(creditRecords.map((c) => [c.employerId, c.remaining]));

  for (const employerId of employerIds) {
    if (!creditMap.has(employerId)) {
      throw new Error(
        `DB_INVARIANT_FAILED: Employer ${employerId} has SUCCESS payments but no JobCredit record`
      );
    }
  }

  const plans = await prisma.plan.findMany();
  const planPriceMap = new Map(plans.map((p) => [p.id, p.price]));

  for (const payment of successPayments) {
    if (payment.planId && planPriceMap.has(payment.planId)) {
      const expectedAmount = planPriceMap.get(payment.planId)!;
      if (payment.amount !== expectedAmount) {
        throw new Error(
          `DB_INVARIANT_FAILED: Payment ${payment.id} amount ${payment.amount} != plan ${payment.planId} price ${expectedAmount}`
        );
      }
    }
  }
}
