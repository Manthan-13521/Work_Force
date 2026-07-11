"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { LayoutDashboard, FileText, User } from "lucide-react";

const links = [
  { href: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/worker/applications", label: "My Applications", icon: FileText },
  { href: "/worker/profile", label: "Profile", icon: User },
];

export function WorkerLayoutClient({ unreadNotifications, children }: { unreadNotifications: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar links={links} title="Workforce" subtitle="Worker" unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
