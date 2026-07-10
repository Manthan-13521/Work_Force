import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
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
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Transaction history</p>
      </div>

      <Card variant="ghost" className="border">
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payments yet" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.user?.name || payment.user?.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.plan?.name || "\u2014"}</TableCell>
                    <TableCell className="font-medium tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell><StatusBadge status={payment.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(new Date(payment.createdAt))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
