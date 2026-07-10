import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp, redisSet, redisGet } from "@/lib/redis";
import { constantTimeEqual } from "@/lib/utils";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      logger.error("RAZORPAY_WEBHOOK_SECRET not configured");
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
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (!signature || !constantTimeEqual(signature, expectedSignature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventId = event.event_id || `${event.event}_${Date.now()}`;
    const eventKey = `webhook:event:${eventId}`;

    const seen = await redisGet(eventKey);
    if (seen) {
      return NextResponse.json({ received: true });
    }
    await redisSet(eventKey, "1", 3600);

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

      const paidAmount = razorpayPayment.amount;
      const expectedAmount = dbPayment.amount * 100;
      if (paidAmount !== expectedAmount) {
        logger.error("Payment amount mismatch", {
          orderId,
          expected: expectedAmount,
          received: paidAmount,
        });
        return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
      }

      const plan = dbPayment.plan;

      const updatedCount = await prisma.$transaction(async (tx) => {
        const result = await tx.payment.updateMany({
          where: { id: dbPayment.id, status: "PENDING" },
          data: { status: "SUCCESS", razorpayPaymentId: paymentId },
        });
        if (result.count === 0) return 0;

        const currentCredit = await tx.jobCredit.findUnique({
          where: { employerId: dbPayment.userId },
          select: { expiryDate: true },
        });
        const newExpiry = new Date(Date.now() + plan.durationDays * 86400000);
        const finalExpiry =
          currentCredit?.expiryDate && currentCredit.expiryDate > newExpiry
            ? currentCredit.expiryDate
            : newExpiry;

        await tx.jobCredit.upsert({
          where: { employerId: dbPayment.userId },
          create: {
            employerId: dbPayment.userId,
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

      await recordAuditEvent({
        action: "PAYMENT_COMPLETED",
        actorId: dbPayment.userId,
        actorRole: "EMPLOYER",
        resource: "payment",
        resourceId: dbPayment.id,
        metadata: { razorpayOrderId: orderId, razorpayPaymentId: paymentId, webhook: true },
      });

      if (updatedCount === 0) {
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

      const failedPayment = await prisma.payment.findFirst({
        where: { razorpayOrderId: orderId },
        select: { userId: true },
      });

      if (failedPayment) {
        await recordAuditEvent({
          action: "PAYMENT_FAILED",
          actorId: failedPayment.userId,
          actorRole: "EMPLOYER",
          resource: "payment",
          metadata: { razorpayOrderId: orderId, webhook: true },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
