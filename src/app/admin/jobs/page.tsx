import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminJobs } from "@/actions/admin.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { JobActions } from "./job-actions";

export default async function AdminJobsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: jobs, nextCursor, hasMore } = await getAdminJobs({ cursor, limit });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Jobs</h1>
      <Card>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No jobs found" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Employer</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Applicants</th>
                    <th className="text-left p-3 font-medium">Posted</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{job.title}</td>
                      <td className="p-3">{job.employer?.employerProfile?.companyName || job.employer?.name}</td>
                      <td className="p-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="p-3">{job._count.applications}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(new Date(job.createdAt))}</td>
                      <td className="p-3 text-right">
                        <JobActions jobId={job.id} status={job.status} />
                      </td>
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
