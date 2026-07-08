import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getWorkerApplications } from "@/actions/application.actions";
import { formatRelativeTime } from "@/lib/utils";
import { FileText, Search, Briefcase, TrendingUp, Eye } from "lucide-react";

export default async function WorkerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WORKER") redirect("/login");

  const { data: applications } = await getWorkerApplications();

  const stats = {
    total: applications.length,
    active: applications.filter((a) => a.status === "APPLIED" || a.status === "SHORTLISTED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    hired: applications.filter((a) => a.status === "HIRED").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back{user.name ? `, ${user.name}` : ""}</h1>
        <p className="text-muted-foreground">Here&apos;s your job search overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Eye className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.shortlisted}</p>
              <p className="text-sm text-muted-foreground">Shortlisted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Briefcase className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.hired}</p>
              <p className="text-sm text-muted-foreground">Hired</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Applications</CardTitle>
          <Link href="/worker/applications">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No applications yet"
              description="Browse jobs and apply to get started"
              action={
                <Link href="/jobs">
                  <Button>Browse Jobs</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{app.job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {app.job.employer?.employerProfile?.companyName || app.job.employer?.name} • {app.job.location} • {formatRelativeTime(new Date(app.appliedAt))}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
