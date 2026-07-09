"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Briefcase, Bell } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user?: {
    role: string;
    name?: string | null;
    unreadNotifications?: number;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/workers", label: "Browse Workers" },
    { href: "/pricing", label: "Pricing" },
  ];

  const workerLinks = [
    { href: "/worker/dashboard", label: "Dashboard" },
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/worker/applications", label: "My Applications" },
    { href: "/worker/profile", label: "Profile" },
  ];

  const employerLinks = [
    { href: "/employer/dashboard", label: "Dashboard" },
    { href: "/employer/jobs/new", label: "Post Job" },
    { href: "/employer/jobs", label: "My Jobs" },
    { href: "/employer/payments", label: "Plans" },
    { href: "/employer/profile", label: "Profile" },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/reports", label: "Reports" },
  ];

  const getLinks = () => {
    if (!user) return publicLinks;
    if (user.role === "WORKER") return workerLinks;
    if (user.role === "EMPLOYER") return employerLinks;
    if (user.role === "ADMIN") return adminLinks;
    return publicLinks;
  };

  const links = getLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Briefcase className="h-6 w-6 text-primary" />
          <span>Workforce</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
                  {(user.unreadNotifications ?? 0) > 0 && (
                <Link href={user.role === "WORKER" ? "/worker/applications" : "/employer/dashboard"} className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-destructive rounded-full">
                    {Math.min(user.unreadNotifications ?? 0, 9)}
                  </span>
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                {user.name || user.role}
              </span>
              <form action="/api/logout" method="post">
                <Button variant="outline" size="sm" type="submit">Logout</Button>
              </form>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block py-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t">
            {!user ? (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full" size="sm">Login</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" size="sm">Sign Up</Button>
                </Link>
              </div>
            ) : (
              <form action="/api/logout" method="post">
                <Button variant="outline" size="sm" className="w-full" type="submit">Logout</Button>
              </form>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
