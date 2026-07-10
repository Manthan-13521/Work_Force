import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getAdminAnalytics } from "@/actions/analytics.actions";
import { getAdminInsights, getAdminRecommendations } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";
import { InsightCard } from "@/components/dashboard/insight-card";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { HealthScoreRing, HealthScoreDetails } from "@/components/dashboard/health-score";
import { Users, Briefcase, FileText, IndianRupee, Eye, UserCheck, TrendingUp, Sparkles, Target } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [stats, intelligence] = await Promise.all([
    getAdminAnalytics(),
    getAdminInsights(),
  ]);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, sub: `${stats.totalWorkers} workers \u00b7 ${stats.totalEmployers} employers`, icon: Users, gradient: "from-blue-500/20 to-blue-500/5 text-blue-600" },
    { label: "Active Jobs", value: stats.totalJobs, icon: Briefcase, gradient: "from-purple-500/20 to-purple-500/5 text-purple-600" },
    { label: "Applications", value: stats.totalApplications, sub: `${stats.recentApplications} in last 30 days`, icon: FileText, gradient: "from-orange-500/20 to-orange-500/5 text-orange-600" },
    { label: "Job Views", value: stats.totalViews, icon: Eye, gradient: "from-teal-500/20 to-teal-500/5 text-teal-600" },
    { label: "Total Hires", value: stats.totalHires, icon: UserCheck, gradient: "from-green-500/20 to-green-500/5 text-green-600" },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: IndianRupee, gradient: "from-emerald-500/20 to-emerald-500/5 text-emerald-600" },
  ];

  const recommendations = getAdminRecommendations({
    verificationBacklog: intelligence.verificationBacklog,
    pendingReports: intelligence.pendingReports,
    userGrowth: intelligence.userTrend.percentage,
  });

  return (
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform overview and key metrics</p>
      </div>

      {intelligence.insights.length > 0 && (
        <div className="space-y-3" aria-label="Insights">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Insights
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {intelligence.insights.slice(0, 4).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label} variant="ghost" className="border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{card.label}</span>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

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
              Platform Health
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

      {stats.jobsByCategory.length > 0 && (
        <Card variant="ghost" className="border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Jobs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.jobsByCategory.map((cat) => {
                const maxCount = Math.max(...stats.jobsByCategory.map((c) => c.count));
                const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground">{cat.category}</span>
                      <span className="text-muted-foreground tabular-nums">{cat.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
