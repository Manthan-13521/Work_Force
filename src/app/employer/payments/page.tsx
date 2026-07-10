import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getPlans, getEmployerPayments } from "@/actions/payment.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { Check, CreditCard } from "lucide-react";
import { BuyPlanButton } from "./buy-plan-button";

export default async function EmployerPaymentsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const [plans, { data: payments, nextCursor, hasMore }] = await Promise.all([getPlans(), getEmployerPayments({ cursor, limit })]);

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Plans and Billing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Choose a plan that fits your hiring needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} variant={plan.isFeatured ? "elevated" : "default"} className={`relative flex flex-col ${plan.isFeatured ? "border-primary/30 ring-1 ring-primary/20" : ""}`}>
            {plan.isFeatured && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                <Badge variant="info" size="lg">Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <CardDescription>
                {plan.jobPostLimit} job post{plan.jobPostLimit > 1 ? "s" : ""} for {plan.durationDays} days
              </CardDescription>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight">
                  {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm ml-1">/mo</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm flex-1">
              {[
                `${plan.jobPostLimit} job post${plan.jobPostLimit > 1 ? "s" : ""}`,
                `${plan.durationDays} day${plan.durationDays > 1 ? "s" : ""} validity`,
                ...(plan.isFeatured ? ["Featured badge on listing"] : []),
                "Applicant management",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-success" strokeWidth={3} />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              {plan.price === 0 ? (
                <Link href="/employer/jobs/new" className="w-full">
                  <Button variant="outline" className="w-full">Start Free</Button>
                </Link>
              ) : (
                <BuyPlanButton planId={plan.id} price={plan.price} name={plan.name} />
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card variant="ghost" className="border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-8 w-8" />}
              title="No payments yet"
              description="Purchase a plan to see your payment history here"
            />
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{payment.plan?.name || "Payment"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(new Date(payment.createdAt))}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium tabular-nums">{formatCurrency(payment.amount)}</p>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
