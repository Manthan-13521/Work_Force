import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getWorkerApplications } from "@/actions/application.actions";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { Search, Building, MapPin, IndianRupee } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function WorkerApplicationsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "WORKER") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: applications, nextCursor, hasMore } = await getWorkerApplications({ cursor, limit });

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your job applications</p>
      </div>

      {applications.length === 0 ? (
        <Card variant="ghost" className="border">
          <CardContent>
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No applications yet"
              description="Start browsing jobs and apply to ones that match your skills"
              action={
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const employer = app.job.employer;
            const isHired = app.status === "HIRED";
            const isShortlisted = app.status === "SHORTLISTED";

            return (
              <Card key={app.id} variant="ghost" className="border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{app.job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Building className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{employer?.employerProfile?.companyName || employer?.name}</span>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{app.job.location || app.job.city}</span>
                    </div>
                    {app.job.salaryMin && (
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>{formatCurrency(app.job.salaryMin)}{app.job.salaryMax ? ` - ${formatCurrency(app.job.salaryMax)}` : ""}/mo</span>
                      </div>
                    )}
                    <span className="text-xs">Applied {formatRelativeTime(new Date(app.appliedAt))}</span>
                  </div>

                  {(isHired || isShortlisted) && employer && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {isHired ? "Employer contact (shared after hiring):" : "Contact will be shared after hiring"}
                      </p>
                      {isHired && (
                        <p className="text-sm font-medium">
                          {employer.phone || "Contact info pending"}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
