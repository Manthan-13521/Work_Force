import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getReports } from "@/actions/admin.actions";
import { formatRelativeTime } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { ReportActions } from "./report-actions";
import { Shield } from "lucide-react";

export default async function AdminReportsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: reports, nextCursor, hasMore } = await getReports({ cursor, limit });

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Moderate reported content</p>
      </div>

      <Card variant="ghost" className="border">
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Shield className="h-8 w-8" />} title="No reports" description="All clear! No reported content." />
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div key={report.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">Report #{report.id.slice(0, 8)}</p>
                      <StatusBadge status={report.status} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground/70 font-medium">Target:</span> {report.targetType} ({report.targetId.slice(0, 8)})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-foreground/70 font-medium">Reason:</span> {report.reason}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Reported by {report.reporter?.name || report.reporter?.phone || "Unknown"} &bull; {formatRelativeTime(new Date(report.createdAt))}
                    </p>
                  </div>
                  <ReportActions reportId={report.id} status={report.status} />
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
