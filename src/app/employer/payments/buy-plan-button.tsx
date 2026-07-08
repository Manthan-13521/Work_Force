"use client";

import { Button } from "@/components/ui/button";
import { createRazorpayOrder } from "@/actions/payment.actions";
import { useState } from "react";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { contact: string; email: string };
  theme: { color: string };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

interface BuyPlanButtonProps {
  planId: string;
  price: number;
  name: string;
}

export function BuyPlanButton({ planId, name }: BuyPlanButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    setLoading(true);
    const result = await createRazorpayOrder(planId);
    setLoading(false);

    if ("error" in result) {
      alert(result.error);
      return;
    }

    const options: RazorpayOptions = {
      key: result.key,
      amount: result.amount,
      currency: result.currency,
      name: "Workforce",
      description: `${name} Plan`,
      order_id: result.orderId,
      handler: async function (response: RazorpayResponse) {
        const { verifyPayment } = await import("@/actions/payment.actions");
        const res = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        if (res.success) {
          window.location.reload();
        } else {
          alert("Payment verification failed. Please contact support.");
        }
      },
      prefill: {
        contact: "",
        email: "",
      },
      theme: {
        color: "#1a1a2e",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <Button className="w-full" onClick={handlePurchase} loading={loading}>
      Buy {name}
    </Button>
  );
}
