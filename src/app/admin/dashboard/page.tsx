import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getAdminAnalytics } from "@/actions/analytics.actions";
import { formatCurrency } from "@/lib/utils";
import { Users, Briefcase, FileText, IndianRupee, Eye, UserCheck, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const stats = await getAdminAnalytics();

  const cards = [
    { label: "Total Users", value: stats.totalUsers, sub: `${stats.totalWorkers} workers, ${stats.totalEmployers} employers`, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Active Jobs", value: stats.totalJobs, icon: Briefcase, color: "bg-purple-100 text-purple-600" },
    { label: "Applications", value: stats.totalApplications, sub: `${stats.recentApplications} in last 30 days`, icon: FileText, color: "bg-orange-100 text-orange-600" },
    { label: "Job Views", value: stats.totalViews, icon: Eye, color: "bg-teal-100 text-teal-600" },
    { label: "Total Hires", value: stats.totalHires, icon: UserCheck, color: "bg-green-100 text-green-600" },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: IndianRupee, color: "bg-emerald-100 text-emerald-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                  {card.sub && <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs by Category */}
      {stats.jobsByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Jobs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.jobsByCategory.map((cat) => {
                const maxCount = Math.max(...stats.jobsByCategory.map((c) => c.count));
                const pct = maxCount > 0 ? (cat.count / maxCount) * 100 : 0;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{cat.category}</span>
                      <span className="text-muted-foreground">{cat.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
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
