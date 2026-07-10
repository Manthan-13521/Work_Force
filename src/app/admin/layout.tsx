import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cacheKey } from "@/lib/cache";
import { cached } from "@/lib/cache/cache";
import { TTL } from "@/lib/cache/ttl";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { LayoutDashboard, Users, FileText, AlertTriangle, CreditCard, Tags, CheckSquare } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const unreadNotifications = await cached(
    cacheKey("notifications:count", user.id),
    () => prisma.notification.count({ where: { userId: user.id, read: false } }),
    { freshTtl: TTL.NOTIFICATION_COUNT.fresh, staleTtl: TTL.NOTIFICATION_COUNT.stale },
  );

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/jobs", label: "Jobs", icon: FileText },
    { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar links={links} title="Workforce" subtitle="Admin Panel" unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
