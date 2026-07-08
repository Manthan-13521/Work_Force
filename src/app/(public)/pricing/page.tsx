import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { formatCurrency } from "@/lib/utils";
import { getPlans } from "@/actions/payment.actions";
import { Check } from "lucide-react";

export default async function PricingPage() {
  const plans = await getPlans();

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free and upgrade when you need more. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            No plans available yet.
          </div>
        ) : plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.isFeatured ? "border-primary shadow-lg" : ""}`}>
            {plan.isFeatured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="verified">Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.isFeatured
                  ? "Feature a single job listing"
                  : `Post up to ${plan.jobPostLimit} job${plan.jobPostLimit > 1 ? "s" : ""}`}
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground ml-1">/mo</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{plan.jobPostLimit} job post{plan.jobPostLimit > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{plan.durationDays} day{plan.durationDays > 1 ? "s" : ""} validity</span>
              </div>
              {plan.isFeatured && (
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Featured badge on listing</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>View applicant profiles</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Shortlist & hire</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/register?role=employer" className="w-full">
                <Button className="w-full" variant={plan.price === 0 ? "outline" : "default"}>
                  {plan.price === 0 ? "Get Started Free" : "Choose Plan"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
