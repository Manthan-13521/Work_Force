"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { env } from "@/env";
import Razorpay from "razorpay";
import crypto from "crypto";
import { buildPaginatedResponse, PAGE_SIZE } from "@/lib/pagination";
import { createRazorpayOrderSchema } from "@/lib/schemas";

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

    const razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID || "",
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `plan_${user.id}_${Date.now()}`,
    });

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

    if (expectedSignature !== razorpaySignature) {
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

    if (payment.status === "SUCCESS") {
      return { success: true };
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS", razorpayPaymentId },
      }),
      prisma.jobCredit.upsert({
        where: { employerId: user.id },
        create: {
          employerId: user.id,
          remaining: payment.plan.jobPostLimit,
          expiryDate: new Date(Date.now() + payment.plan.durationDays * 86400000),
        },
        update: {
          remaining: { increment: payment.plan.jobPostLimit },
          expiryDate: new Date(Date.now() + payment.plan.durationDays * 86400000),
        },
      }),
    ]);

    return { success: true };
  } catch {
    return { error: "Payment verification failed. Please contact support." };
  }
}

export async function getPlans() {
  return prisma.plan.findMany({ select: { id: true, name: true, price: true, durationDays: true, jobPostLimit: true, isFeatured: true }, orderBy: { price: "asc" } });
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
