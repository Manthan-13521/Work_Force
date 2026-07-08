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
    <div>
      <h1 className="text-2xl font-bold mb-6">My Applications</h1>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
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
        <div className="space-y-4">
          {applications.map((app) => {
            const employer = app.job.employer;
            const isHired = app.status === "HIRED";
            const isShortlisted = app.status === "SHORTLISTED";

            return (
              <Card key={app.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{app.job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Building className="h-3.5 w-3.5" />
                        <span>{employer?.employerProfile?.companyName || employer?.name}</span>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{app.job.location || app.job.city}</span>
                    </div>
                    {app.job.salaryMin && (
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        <span>{formatCurrency(app.job.salaryMin)}{app.job.salaryMax ? ` - ${formatCurrency(app.job.salaryMax)}` : ""}/mo</span>
                      </div>
                    )}
                    <span>Applied {formatRelativeTime(new Date(app.appliedAt))}</span>
                  </div>

                  {(isHired || isShortlisted) && employer && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
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
