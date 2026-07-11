import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWorkerApplications } from "@/actions/application.actions";
import { getWorkerInsights, getWorkerRecommendations } from "@/lib/dashboard";
import { WorkerDashboardClient } from "@/components/dashboard/worker-dashboard-client";

export default async function WorkerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WORKER") redirect("/login");

  const [{ data: applications }, intelligence] = await Promise.all([
    getWorkerApplications(),
    getWorkerInsights(user.id),
  ]);

  const stats = {
    total: applications.length,
    active: applications.filter((a) => a.status === "APPLIED" || a.status === "SHORTLISTED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    hired: applications.filter((a) => a.status === "HIRED").length,
  };

  const recommendations = getWorkerRecommendations({
    profileComplete: intelligence.profileHealth.score >= 55,
    isVerified: intelligence.profileHealth.reasons.some((r) => r.includes("Identity verified")),
    hasApplications: applications.length > 0,
    recentShortlist: stats.shortlisted > 0,
  });

  return (
    <WorkerDashboardClient
      userName={user.name}
      stats={stats}
      intelligence={intelligence}
      recommendations={recommendations}
      applications={applications}
    />
  );
}
