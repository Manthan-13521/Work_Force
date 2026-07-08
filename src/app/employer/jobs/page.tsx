import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerJobs } from "@/actions/job.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { PlusCircle, Users, MapPin, Eye } from "lucide-react";

export default async function EmployerJobsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: jobs, nextCursor, hasMore } = await getEmployerJobs({ cursor, limit });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link href="/employer/jobs/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              title="No jobs posted yet"
              description="Post your first job and start receiving applications from verified workers"
              action={
                <Link href="/employer/jobs/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post a Job
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{job.title}</h3>
                      {job.isFeatured && <Badge variant="verified">Featured</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location || job.city}
                      </span>
                      <span>{formatDate(new Date(job.createdAt))}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                  <Link href={`/employer/jobs/${job.id}/applicants`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      View Applicants
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
