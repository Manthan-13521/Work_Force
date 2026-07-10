import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cacheKey } from "@/lib/cache";
import { cached } from "@/lib/cache/cache";
import { TTL } from "@/lib/cache/ttl";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { LayoutDashboard, PlusCircle, FileText, CreditCard, Building } from "lucide-react";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "EMPLOYER") {
    if (user.role === "WORKER") redirect("/worker/dashboard");
    if (user.role === "ADMIN") redirect("/admin/dashboard");
  }

  const unreadNotifications = await cached(
    cacheKey("notifications:count", user.id),
    () => prisma.notification.count({ where: { userId: user.id, read: false } }),
    { freshTtl: TTL.NOTIFICATION_COUNT.fresh, staleTtl: TTL.NOTIFICATION_COUNT.stale },
  );

  const links = [
    { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employer/jobs/new", label: "Post a Job", icon: PlusCircle },
    { href: "/employer/jobs", label: "My Jobs", icon: FileText },
    { href: "/employer/payments", label: "Plans & Billing", icon: CreditCard },
    { href: "/employer/profile", label: "Company Profile", icon: Building },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar links={links} title="Workforce" subtitle="Employer" unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
