import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getPlans } from "@/actions/payment.actions";
import { breadcrumbSchema } from "@/lib/jsonld";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Transparent Plans for Hiring | Workforce",
  description: "Start free and upgrade when you need more job posts. No hidden fees, no surprises. Choose the right plan for your hiring needs.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/pricing`,
  },
};

export default async function PricingPage() {
  const plans = await getPlans();

  const schemas = [
    breadcrumbSchema([{ name: "Pricing", url: "/pricing" }]),
  ];

  return (
    <div className="px-5 lg:px-8 py-20">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.06] border border-primary/[0.08] text-xs font-medium text-primary mb-5">
            Simple pricing
          </div>
          <h1 className="text-[2rem] md:text-[2.75rem] font-bold tracking-tight mb-3">
            Transparent pricing
          </h1>
          <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start free and upgrade when you need more job posts. No hidden fees, no surprises.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No plans available yet.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isFree = plan.price === 0;
              return (
                <Card
                  key={plan.id}
                  variant={plan.isFeatured ? "elevated" : "default"}
                  className={`relative flex flex-col ${plan.isFeatured ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
                >
                  {plan.isFeatured && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                      <Badge variant="info" size="lg">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="mb-5">
                      <h3 className="font-semibold text-base mb-0.5">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.isFeatured
                          ? "Feature a single job listing"
                          : `Post up to ${plan.jobPostLimit} job${plan.jobPostLimit > 1 ? "s" : ""}`}
                      </p>
                    </div>

                    <div className="mb-6">
                      <span className="text-3xl font-bold tracking-tight">
                        {isFree ? "Free" : formatCurrency(plan.price)}
                      </span>
                      {!isFree && (
                        <span className="text-muted-foreground text-sm ml-1">/mo</span>
                      )}
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {[
                        `${plan.jobPostLimit} job post${plan.jobPostLimit > 1 ? "s" : ""}`,
                        `${plan.durationDays} day${plan.durationDays > 1 ? "s" : ""} validity`,
                        ...(plan.isFeatured ? ["Featured badge on listing"] : []),
                        "View applicant profiles",
                        "Shortlist and hire",
                      ].map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5 text-sm">
                          <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center">
                            <Check className="h-3 w-3 text-success" strokeWidth={3} />
                          </div>
                          <span className="text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 mt-auto">
                      <Link href={isFree ? "/register?role=employer" : "/register?role=employer"}>
                        <Button
                          className="w-full"
                          variant={isFree ? "outline" : plan.isFeatured ? "default" : "secondary"}
                        >
                          {isFree ? "Get Started Free" : "Choose Plan"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            All plans include OTP-verified workers, employer verification, and 24/7 support.
            Need a custom plan? <Link href="/contact" className="text-primary font-medium hover:underline">Contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
