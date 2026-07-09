import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, LayoutDashboard, PlusCircle, FileText, CreditCard, Building, Bell } from "lucide-react";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "EMPLOYER") {
    if (user.role === "WORKER") redirect("/worker/dashboard");
    if (user.role === "ADMIN") redirect("/admin/dashboard");
  }

  const unreadNotifications = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  const links = [
    { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employer/jobs/new", label: "Post a Job", icon: PlusCircle },
    { href: "/employer/jobs", label: "My Jobs", icon: FileText },
    { href: "/employer/payments", label: "Plans & Billing", icon: CreditCard },
    { href: "/employer/profile", label: "Company Profile", icon: Building },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/30 hidden md:block p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Workforce</span>
            </Link>
            {unreadNotifications > 0 && (
              <Link href="/employer/dashboard" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-destructive rounded-full">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              </Link>
            )}
          </div>
        </div>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
