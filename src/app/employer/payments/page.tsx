import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
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
    <div>
      <h1 className="text-2xl font-bold mb-6">Plans & Billing</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.isFeatured ? "border-primary shadow-lg" : ""}`}>
            {plan.isFeatured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="verified">Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.jobPostLimit} job post{plan.jobPostLimit > 1 ? "s" : ""} for {plan.durationDays} days
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground ml-1">/mo</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{plan.jobPostLimit} job post{plan.jobPostLimit > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>{plan.durationDays} day{plan.durationDays > 1 ? "s" : ""} validity</span>
              </div>
              {plan.isFeatured && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Featured badge</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Applicant management</span>
              </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-8 w-8" />}
              title="No payments yet"
              description="Purchase a plan to see your payment history here"
            />
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{payment.plan?.name || "Payment"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(new Date(payment.createdAt))}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
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
