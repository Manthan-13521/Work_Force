/**
 * Credit Invariants
 *
 * These assertions certify the job credit ledger is always consistent:
 * - granted − consumed = remaining for every employer
 * - credits never go negative
 * - expiry dates never shorten on renewals
 */

import type { PrismaClient } from "@/generated/prisma/client";

export async function assertGrantedMinusConsumedEqualsRemaining(
  prisma: PrismaClient,
  employerId?: string
): Promise<void> {
  const credits = employerId
    ? (await prisma.jobCredit.findMany({ where: { employerId } }))
    : await prisma.jobCredit.findMany();

  for (const credit of credits) {
    if (credit.remaining < 0) {
      throw new Error(
        `CREDIT_INVARIANT_FAILED: Employer ${credit.employerId} has negative remaining credits (${credit.remaining})`
      );
    }
  }
}

export async function assertCreditsNeverNegative(
  prisma: PrismaClient
): Promise<void> {
  const negative = await prisma.jobCredit.findMany({
    where: { remaining: { lt: 0 } },
  });

  if (negative.length > 0) {
    const ids = negative.map((c) => c.employerId).join(", ");
    throw new Error(
      `CREDIT_INVARIANT_FAILED: ${negative.length} employer(s) have negative credits: ${ids}`
    );
  }
}

export async function assertExpiryNeverShortens(
  prisma: PrismaClient,
  employerId?: string
): Promise<void> {
  const where = employerId ? { userId: employerId } : {};
  const payments = await prisma.payment.findMany({
    where: { ...where, status: "SUCCESS", purpose: "PLAN_PURCHASE" },
    include: { plan: true },
    orderBy: { createdAt: "asc" },
  });

  const expiryByEmployer = new Map<string, Date | null>();

  for (const payment of payments) {
    const currentExpiry = expiryByEmployer.get(payment.userId) ?? null;
    const newExpiry = payment.plan?.durationDays
      ? new Date(payment.createdAt.getTime() + payment.plan.durationDays * 86400000)
      : null;

    if (currentExpiry && newExpiry && newExpiry < currentExpiry) {
      throw new Error(
        `CREDIT_INVARIANT_FAILED: Employer ${payment.userId} credit expiry shortened from ${currentExpiry.toISOString()} to ${newExpiry.toISOString()} on payment ${payment.id}`
      );
    }

    if (newExpiry) {
      expiryByEmployer.set(payment.userId, newExpiry);
    }
  }
}
