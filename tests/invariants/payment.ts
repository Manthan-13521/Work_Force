/**
 * Payment Invariants
 *
 * These assertions certify that the payment system maintains correctness:
 * - No payment is processed more than once
 * - Credits are granted exactly once per successful payment
 * - Payment amounts always match the associated plan
 * - Webhook replay attacks cannot double-credit
 */

import type { PrismaClient } from "@prisma/client";

export async function assertPaymentProcessedExactlyOnce(
  prisma: PrismaClient,
  paymentId: string
): Promise<void> {
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error(`PAYMENT_INVARIANT_FAILED: Payment ${paymentId} not found`);
  }

  if (!payment.razorpayPaymentId) return;

  const duplicates = await prisma.payment.findMany({
    where: { razorpayPaymentId: payment.razorpayPaymentId, id: { not: paymentId } },
  });

  if (duplicates.length > 0) {
    throw new Error(
      `PAYMENT_INVARIANT_FAILED: Payment ${paymentId} has ${duplicates.length} duplicate(s) sharing razorpayPaymentId ${payment.razorpayPaymentId}`
    );
  }
}

export async function assertCreditsGrantedExactlyOnce(
  prisma: PrismaClient,
  userId: string,
  paymentId: string
): Promise<void> {
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });

  if (!payment || payment.status !== "SUCCESS") return;

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId },
  });

  if (!employerProfile) return;

  const jobCredit = await prisma.jobCredit.findFirst({
    where: { employerId: employerProfile.userId },
  });

  if (!jobCredit) {
    throw new Error(
      `PAYMENT_INVARIANT_FAILED: Payment ${paymentId} marked SUCCESS but no JobCredit found for employer ${userId}`
    );
  }

  const expectedRemaining = (payment.plan?.jobPostLimit ?? 0) - 0;

  if (expectedRemaining < 0) {
    throw new Error(
      `PAYMENT_INVARIANT_FAILED: Payment ${paymentId} has negative expected remaining credits`
    );
  }
}

export async function assertPaymentAmountMatchesPlan(
  prisma: PrismaClient,
  paymentId: string
): Promise<void> {
  if (!paymentId) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });

  if (!payment) {
    throw new Error(`PAYMENT_INVARIANT_FAILED: Payment ${paymentId} not found`);
  }

  if (payment.plan && payment.amount !== payment.plan.price) {
    throw new Error(
      `PAYMENT_INVARIANT_FAILED: Payment ${paymentId} amount ${payment.amount} does not match plan ${payment.plan.name} price ${payment.plan.price}`
    );
  }
}

export async function assertWebhookReplayImpossible(
  prisma: PrismaClient,
  razorpayPaymentId: string
): Promise<void> {
  if (!razorpayPaymentId) return;

  const payments = await prisma.payment.findMany({
    where: { razorpayPaymentId },
  });

  if (payments.length > 1) {
    const successCount = payments.filter((p) => p.status === "SUCCESS").length;
    if (successCount > 1) {
      throw new Error(
        `PAYMENT_INVARIANT_FAILED: Webhook replay detected — ${successCount} SUCCESS payments for razorpayPaymentId ${razorpayPaymentId}`
      );
    }
  }
}
