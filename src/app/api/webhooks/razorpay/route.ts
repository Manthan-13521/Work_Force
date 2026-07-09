import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/redis";

export async function POST(request: NextRequest) {
  try {
    if (!env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const ip = getClientIp(request);
    const allowed = await checkRateLimit(`rate:webhook:${ip}`, 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const razorpayPayment = event.payload.payment.entity;
      const orderId = razorpayPayment.order_id;
      const paymentId = razorpayPayment.id;

      const dbPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
        include: { plan: true },
      });

      if (!dbPayment || !dbPayment.plan) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Idempotency: use updateMany with status filter to prevent race
      const [updated] = await prisma.$transaction([
        prisma.payment.updateMany({
          where: { id: dbPayment.id, status: "PENDING" },
          data: { status: "SUCCESS", razorpayPaymentId: paymentId },
        }),
        prisma.jobCredit.upsert({
          where: { employerId: dbPayment.userId },
          create: {
            employerId: dbPayment.userId,
            remaining: dbPayment.plan.jobPostLimit,
            expiryDate: new Date(Date.now() + dbPayment.plan.durationDays * 86400000),
          },
          update: {
            remaining: { increment: dbPayment.plan.jobPostLimit },
            expiryDate: new Date(Date.now() + dbPayment.plan.durationDays * 86400000),
          },
        }),
      ]);

      // If no rows were updated, another webhook already processed it
      if (updated.count === 0) {
        return NextResponse.json({ received: true });
      }
    }

    if (event.event === "payment.failed") {
      const razorpayPayment = event.payload.payment.entity;
      const orderId = razorpayPayment.order_id;

      await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
