"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { LayoutDashboard, PlusCircle, FileText, CreditCard, Building } from "lucide-react";

const links = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs/new", label: "Post a Job", icon: PlusCircle },
  { href: "/employer/jobs", label: "My Jobs", icon: FileText },
  { href: "/employer/payments", label: "Plans & Billing", icon: CreditCard },
  { href: "/employer/profile", label: "Company Profile", icon: Building },
];

export function EmployerLayoutClient({ unreadNotifications, children }: { unreadNotifications: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar links={links} title="Workforce" subtitle="Employer" unreadNotifications={unreadNotifications} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
