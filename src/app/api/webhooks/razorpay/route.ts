import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    if (!env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
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

      // Idempotency: skip if already processed
      if (dbPayment.status === "SUCCESS") {
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: dbPayment.id },
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
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
