import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerDashboard } from "@/actions/employer.actions";
import { getEmployerAnalytics } from "@/actions/analytics.actions";
import { formatRelativeTime } from "@/lib/utils";
import { Briefcase, Users, PlusCircle, Eye, TrendingUp, BarChart3, Target, UserCheck } from "lucide-react";

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const [data, analytics] = await Promise.all([
    getEmployerDashboard(),
    getEmployerAnalytics(),
  ]);

  const profile = user.employerProfile;
  const isUnverified = profile && !profile.isVerified;

  return (
    <div>
      {isUnverified && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-6 text-sm">
          Your company profile is pending verification. While you can post jobs, they will show as unverified until our team reviews your details.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome{profile?.companyName ? `, ${profile.companyName}` : ""}</h1>
        <p className="text-muted-foreground">Here&apos;s your hiring performance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.activeJobs}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalApplications}</p>
              <p className="text-sm text-muted-foreground">Total Applicants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalHired}</p>
              <p className="text-sm text-muted-foreground">Hired</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Hire Conversion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      {analytics.totalJobs > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Recruitment Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FunnelRow label="Job Posted" value={analytics.totalJobs} total={analytics.totalJobs} color="bg-primary" />
              <FunnelRow label="Job Views" value={analytics.totalViews} total={analytics.totalJobs} color="bg-blue-500" />
              <FunnelRow label="Applications" value={analytics.totalApplications} total={analytics.totalJobs} color="bg-purple-500" />
              <FunnelRow label="Shortlisted" value={analytics.totalShortlisted} total={analytics.totalJobs} color="bg-yellow-500" />
              <FunnelRow label="Hired" value={analytics.totalHired} total={analytics.totalJobs} color="bg-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Overall conversion: {analytics.totalApplications > 0 ? `${analytics.conversionRate}% of applicants get hired` : "No applications yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Job Performance Table */}
      {analytics.jobs.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Job Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Job Title</th>
                    <th className="text-center p-3 font-medium">Views</th>
                    <th className="text-center p-3 font-medium">Apps</th>
                    <th className="text-center p-3 font-medium">Shortlisted</th>
                    <th className="text-center p-3 font-medium">Hired</th>
                    <th className="text-right p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.jobs.map((j) => (
                    <tr key={j.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{j.title}</td>
                      <td className="p-3 text-center">{j.views}</td>
                      <td className="p-3 text-center">{j.applications}</td>
                      <td className="p-3 text-center">{j.shortlisted}</td>
                      <td className="p-3 text-center">{j.hired}</td>
                      <td className="p-3 text-right"><StatusBadge status={j.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credits */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.credits?.remaining || 0}</p>
              <p className="text-sm text-muted-foreground">Job Credits Remaining</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-teal-100">
              <Eye className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{analytics.totalViews}</p>
              <p className="text-sm text-muted-foreground">Total Job Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applicants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Applicants</CardTitle>
          <Link href="/employer/jobs">
            <Button variant="outline" size="sm">View All Jobs</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentApplications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Post a job to start receiving applications"
              action={
                <Link href="/employer/jobs/new">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post a Job
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.recentApplications.slice(0, 10).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{app.worker.name || "Anonymous Worker"}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied to {app.job.title} • {formatRelativeTime(new Date(app.appliedAt))}
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

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / Math.max(total, 1)) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
