"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import Razorpay from "razorpay";
import crypto from "crypto";
import { constantTimeEqual } from "@/lib/utils";
import { buildPaginatedResponse, PAGE_SIZE } from "@/lib/pagination";
import { createRazorpayOrderSchema } from "@/lib/schemas";
import { cached, cacheKey } from "@/lib/cache";
import { recordAuditEvent } from "@/lib/audit";
import { retry } from "@/lib/retry";
import { withTimeout } from "@/lib/timeout";

export async function createRazorpayOrder(planId: string): Promise<
  | { error: string }
  | { orderId: string; amount: number; currency: string; key: string }
> {
  try {
    const user = await requireAuth(["EMPLOYER"]);

    const parsed = createRazorpayOrderSchema.safeParse({ planId });
    if (!parsed.success) return { error: "Invalid plan ID" };

    const plan = await prisma.plan.findUnique({
      where: { id: parsed.data.planId },
      select: { id: true, price: true, isFeatured: true },
    });
    if (!plan) return { error: "Plan not found" };

    if (!env.RAZORPAY_KEY_SECRET) return { error: "Payment not configured" };

    const existingPayment = await prisma.payment.findFirst({
      where: { userId: user.id, planId: plan.id, status: "PENDING" },
      select: { razorpayOrderId: true },
    });
    if (existingPayment?.razorpayOrderId) {
      return {
        orderId: existingPayment.razorpayOrderId,
        amount: plan.price * 100,
        currency: "INR",
        key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      };
    }

    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID || "",
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    const order = await retry(() =>
      withTimeout(
        razorpay.orders.create({
          amount: plan.price * 100,
          currency: "INR",
          receipt: `plan_${user.id}_${plan.id}_${Date.now()}`,
        }),
        10000,
      ),
    );

    try {
      await prisma.payment.create({
        data: {
          userId: user.id,
          planId: plan.id,
          amount: plan.price,
          status: "PENDING",
          razorpayOrderId: order.id,
          purpose: plan.isFeatured ? "FEATURED_JOB" : "PLAN_PURCHASE",
        },
      });
    } catch {
      throw new Error("Failed to create payment record");
    }

    await recordAuditEvent({ action: "PAYMENT_INITIATED", actorId: user.id, actorRole: "EMPLOYER", resource: "payment", metadata: { planId: plan.id, amount: plan.price, razorpayOrderId: order.id } });

    return {
      orderId: order.id,
      amount: plan.price * 100,
      currency: "INR",
      key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    };
  } catch {
    return { error: "Failed to create payment order. Please try again." };
  }
}

export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  try {
    const user = await requireAuth(["EMPLOYER"]);

    if (!env.RAZORPAY_KEY_SECRET) return { error: "Payment not configured" };

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (!constantTimeEqual(expectedSignature, razorpaySignature)) {
      return { error: "Payment verification failed" };
    }

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId, userId: user.id },
      select: {
        id: true,
        status: true,
        plan: {
          select: {
            jobPostLimit: true,
            durationDays: true,
          },
        },
      },
    });

    if (!payment || !payment.plan) return { error: "Payment not found" };
    const plan = payment.plan;

    const updatedCount = await prisma.$transaction(async (tx) => {
      const result = await tx.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "SUCCESS", razorpayPaymentId },
      });
      if (result.count === 0) return 0;

      // Extend expiry from current credits (don't reduce validity on renewal)
      const currentCredit = await tx.jobCredit.findUnique({
        where: { employerId: user.id },
        select: { expiryDate: true },
      });
      const newExpiry = new Date(Date.now() + plan.durationDays * 86400000);
      const finalExpiry =
        currentCredit?.expiryDate && currentCredit.expiryDate > newExpiry
          ? currentCredit.expiryDate
          : newExpiry;

      await tx.jobCredit.upsert({
        where: { employerId: user.id },
        create: {
          employerId: user.id,
          remaining: plan.jobPostLimit,
          expiryDate: finalExpiry,
        },
        update: {
          remaining: { increment: plan.jobPostLimit },
          expiryDate: finalExpiry,
        },
      });
      return 1;
    });

    if (updatedCount === 0) {
      await recordAuditEvent({ action: "PAYMENT_COMPLETED", actorId: user.id, actorRole: "EMPLOYER", resource: "payment", resourceId: payment.id, metadata: { razorpayOrderId: razorpayOrderId, razorpayPaymentId: razorpayPaymentId, plan: plan.jobPostLimit + " credits" } });
      return { success: true };
    }

    await recordAuditEvent({ action: "PAYMENT_COMPLETED", actorId: user.id, actorRole: "EMPLOYER", resource: "payment", resourceId: payment.id, metadata: { razorpayOrderId: razorpayOrderId, razorpayPaymentId: razorpayPaymentId, plan: plan.jobPostLimit + " credits" } });
    return { success: true };
  } catch {
    return { error: "Payment verification failed. Please contact support." };
  }
}

export async function getPlans() {
  return cached(cacheKey("plans"), () =>
    prisma.plan.findMany({ select: { id: true, name: true, price: true, durationDays: true, jobPostLimit: true, isFeatured: true }, orderBy: { price: "asc" } }),
  { ttl: 600 });
}

export async function getEmployerPayments(pagination?: { cursor?: string; limit?: number }) {
  const user = await requireAuth(["EMPLOYER"]);
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.payment.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      plan: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}

export async function getAdminPayments(pagination?: { cursor?: string; limit?: number }) {
  await requireAuth(["ADMIN"]);
  const limitVal = pagination?.limit ?? PAGE_SIZE;
  const items = await prisma.payment.findMany({
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, phone: true } },
      plan: { select: { name: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limitVal + 1,
    ...(pagination?.cursor ? { cursor: { id: pagination.cursor }, skip: 1 } : {}),
  });
  return buildPaginatedResponse(items, limitVal);
}
