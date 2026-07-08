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
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <Card>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No reports" description="All clear! No reported content." />
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div key={report.id} className="p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">Report #{report.id.slice(0, 8)}</p>
                      <StatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Target:</strong> {report.targetType} ({report.targetId.slice(0, 8)})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Reason:</strong> {report.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by {report.reporter?.name || report.reporter?.phone || "Unknown"} • {formatRelativeTime(new Date(report.createdAt))}
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
