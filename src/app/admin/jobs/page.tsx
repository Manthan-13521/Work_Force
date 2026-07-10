import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminJobs } from "@/actions/admin.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { JobActions } from "./job-actions";
import { Briefcase } from "lucide-react";

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
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage all job listings on the platform</p>
      </div>

      <Card variant="ghost" className="border">
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<Briefcase className="h-8 w-8" />} title="No jobs found" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Employer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="text-muted-foreground">{job.employer?.employerProfile?.companyName || job.employer?.name}</TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="tabular-nums">{job._count.applications}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(new Date(job.createdAt))}</TableCell>
                    <TableCell className="text-right"><JobActions jobId={job.id} status={job.status} /></TableCell>
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
