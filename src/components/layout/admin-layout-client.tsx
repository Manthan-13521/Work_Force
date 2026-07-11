"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { LayoutDashboard, Users, FileText, AlertTriangle, CreditCard, Tags, CheckSquare } from "lucide-react";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: FileText },
  { href: "/admin/reports", label: "Reports", icon: AlertTriangle },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
];

export function AdminLayoutClient({ unreadNotifications, children }: { unreadNotifications: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar links={links} title="Workforce" subtitle="Admin Panel" unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
