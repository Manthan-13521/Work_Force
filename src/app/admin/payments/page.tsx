import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminPayments } from "@/actions/payment.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { CreditCard } from "lucide-react";

export default async function AdminPaymentsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: payments, nextCursor, hasMore } = await getAdminPayments({ cursor, limit });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <Card>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payments yet" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Plan</th>
                    <th className="text-left p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">{payment.user?.name || payment.user?.phone}</td>
                      <td className="p-3">{payment.plan?.name || "—"}</td>
                      <td className="p-3 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="p-3"><StatusBadge status={payment.status} /></td>
                      <td className="p-3 text-muted-foreground">{formatDate(new Date(payment.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
