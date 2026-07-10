import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerJobs } from "@/actions/job.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { PlusCircle, Users, MapPin, Eye, Briefcase } from "lucide-react";

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
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your job listings</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card variant="ghost" className="border">
          <CardContent>
            <EmptyState
              icon={<Briefcase className="h-10 w-10" />}
              title="No jobs posted yet"
              description="Post your first job and start receiving applications from verified workers"
              action={
                <Link href="/employer/jobs/new">
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Post a Job
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} variant="ghost" className="border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      {job.isFeatured && <Badge variant="info" size="sm">Featured</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {job.location || job.city}
                      </span>
                      <span className="text-xs">{formatDate(new Date(job.createdAt))}</span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" strokeWidth={1.5} />
                    <span>{job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}</span>
                  </div>
                  <Link href={`/employer/jobs/${job.id}/applicants`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="h-3.5 w-3.5" />
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
