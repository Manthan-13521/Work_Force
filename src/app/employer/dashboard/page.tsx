import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerDashboard } from "@/actions/employer.actions";
import { getEmployerAnalytics } from "@/actions/analytics.actions";
import { formatRelativeTime } from "@/lib/utils";
import { getEmployerInsights, getEmployerRecommendations } from "@/lib/dashboard";
import { InsightCard } from "@/components/dashboard/insight-card";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { HealthScoreRing, HealthScoreDetails } from "@/components/dashboard/health-score";
import { Briefcase, Users, PlusCircle, Eye, TrendingUp, BarChart3, Target, UserCheck, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

const funnelColors = ["bg-primary", "bg-info", "bg-warning", "bg-destructive/70", "bg-success"];

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / Math.max(total, 1)) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const [data, analytics, intelligence] = await Promise.all([
    getEmployerDashboard(),
    getEmployerAnalytics(),
    getEmployerInsights(user.id),
  ]);

  const profile = user.employerProfile;
  const isUnverified = profile && !profile.isVerified;

  const recommendations = getEmployerRecommendations({
    isVerified: !!profile?.isVerified,
    activeJobs: data.activeJobs,
    creditRemaining: data.credits?.remaining || 0,
    hasExpiringJobs: intelligence.expiringJobs.length > 0,
    hasInactiveJobs: false,
    jobsWithNoApps: intelligence.jobsWithNoApplications.length,
    recentApplications: data.recentApplications.length,
  });

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      {isUnverified && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/20 bg-warning/5" role="alert">
          <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-medium mb-0.5">Company verification pending</p>
            <p className="text-muted-foreground">
              Your profile is under review. Jobs will show as unverified until approved.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {profile?.companyName || "Employer Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your hiring overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Jobs", value: data.activeJobs, icon: Briefcase, color: "from-primary/20 to-primary/5 text-primary" },
          { label: "Total Applicants", value: analytics.totalApplications, icon: Users, color: "from-info/20 to-info/5 text-info" },
          { label: "Hired", value: analytics.totalHired, icon: UserCheck, color: "from-success/20 to-success/5 text-success" },
          { label: "Hire Rate", value: `${analytics.conversionRate}%`, icon: TrendingUp, color: "from-warning/20 to-warning/5 text-warning" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} variant="ghost" className="border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {intelligence.insights.length > 0 && (
        <div className="space-y-3" aria-label="Insights">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Insights
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {intelligence.insights.slice(0, 4).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {analytics.totalJobs > 0 && (
          <Card variant="ghost" className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Recruitment Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <FunnelRow label="Jobs Posted" value={analytics.totalJobs} total={analytics.totalJobs} color={funnelColors[0]} />
                <FunnelRow label="Job Views" value={analytics.totalViews} total={analytics.totalJobs} color={funnelColors[1]} />
                <FunnelRow label="Applications" value={analytics.totalApplications} total={analytics.totalJobs} color={funnelColors[2]} />
                <FunnelRow label="Shortlisted" value={analytics.totalShortlisted} total={analytics.totalJobs} color={funnelColors[3]} />
                <FunnelRow label="Hired" value={analytics.totalHired} total={analytics.totalJobs} color={funnelColors[4]} />
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {analytics.totalApplications > 0
                  ? `${analytics.conversionRate}% of applicants get hired`
                  : "No applications yet"}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card variant="ghost" className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Job Credits</p>
                    <p className="text-lg font-bold tabular-nums">{data.credits?.remaining || 0}</p>
                  </div>
                </div>
                <Link href="/employer/payments">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                    Buy more credits <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card variant="ghost" className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Eye className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Views</p>
                    <p className="text-lg font-bold tabular-nums">{analytics.totalViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {data.recentApplications.length > 0 && (
            <Card variant="ghost" className="border">
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-semibold">Recent Applicants</CardTitle>
                <Link href="/employer/jobs">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {data.recentApplications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                          {(app.worker.name || "A")[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{app.worker.name || "Anonymous Worker"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.job.title} &bull; {formatRelativeTime(new Date(app.appliedAt))}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {analytics.jobs.length > 0 && (
        <Card variant="ghost" className="border">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-semibold">Job Performance</CardTitle>
            <Link href="/employer/jobs">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage jobs <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Apps</TableHead>
                  <TableHead className="text-center">Shortlisted</TableHead>
                  <TableHead className="text-center">Hired</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell className="text-center tabular-nums">{j.views}</TableCell>
                    <TableCell className="text-center tabular-nums">{j.applications}</TableCell>
                    <TableCell className="text-center tabular-nums">{j.shortlisted}</TableCell>
                    <TableCell className="text-center tabular-nums">{j.hired}</TableCell>
                    <TableCell className="text-right"><StatusBadge status={j.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card variant="ghost" className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.slice(0, 4).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </CardContent>
        </Card>

        <Card variant="ghost" className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Account Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <HealthScoreRing score={intelligence.healthScore} size="md" />
              <HealthScoreDetails score={intelligence.healthScore} className="flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {data.recentApplications.length === 0 && (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No applications yet"
          description="Post a job to start receiving applications from verified workers"
          action={
            <Link href="/employer/jobs/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Post a Job
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
