"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import { InsightCard } from "@/components/dashboard/insight-card";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { HealthScoreRing, HealthScoreDetails } from "@/components/dashboard/health-score";
import { FileText, Search, Briefcase, TrendingUp, Eye, ArrowRight, Sparkles, Target } from "lucide-react";
import type { WorkerDashboardInsights } from "@/lib/dashboard";
import type { Recommendation } from "@/lib/dashboard";

interface Stats {
  total: number;
  active: number;
  shortlisted: number;
  hired: number;
}

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: Date;
    job: {
    title: string;
    location: string | null;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    employer: {
      name: string | null;
      phone: string | null;
      employerProfile: { companyName: string | null } | null;
    };
  };
}

interface WorkerDashboardClientProps {
  userName: string | null;
  stats: Stats;
  intelligence: WorkerDashboardInsights;
  recommendations: Recommendation[];
  applications: ApplicationItem[];
}

export function WorkerDashboardClient({
  userName,
  stats,
  intelligence,
  recommendations,
  applications,
}: WorkerDashboardClientProps) {
  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          {userName ? `Welcome, ${userName}` : "Worker Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your job search overview</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: stats.total, icon: FileText, gradient: "from-primary/20 to-primary/5 text-primary" },
          { label: "Active", value: stats.active, icon: Eye, gradient: "from-warning/20 to-warning/5 text-warning" },
          { label: "Shortlisted", value: stats.shortlisted, icon: TrendingUp, gradient: "from-info/20 to-info/5 text-info" },
          { label: "Hired", value: stats.hired, icon: Briefcase, gradient: "from-success/20 to-success/5 text-success" },
        ].map(({ label, value, icon: Icon, gradient }) => (
          <Card key={label} variant="ghost" className="border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
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
        <Card variant="ghost" className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.length > 0 ? recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            )) : (
              <p className="text-sm text-muted-foreground">You&apos;re all set! Keep applying to jobs.</p>
            )}
          </CardContent>
        </Card>

        <Card variant="ghost" className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Profile Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <HealthScoreRing score={intelligence.profileHealth} size="md" />
              <HealthScoreDetails score={intelligence.profileHealth} className="flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="ghost" className="border">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-semibold">Recent Applications</CardTitle>
          <Link href="/worker/applications">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No applications yet"
              description="Browse jobs and apply to get started"
              action={
                <Link href="/jobs">
                  <Button className="gap-2">
                    <Search className="h-4 w-4" />
                    Browse Jobs
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-0.5">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                      {(app.job.title || "J")[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{app.job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.job.employer?.employerProfile?.companyName || app.job.employer?.name} &bull; {app.job.location} &bull; {formatRelativeTime(new Date(app.appliedAt))}
                      </p>
                    </div>
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
