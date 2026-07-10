"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Bell, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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
    { href: "/jobs", label: "Jobs" },
    { href: "/workers", label: "Workers" },
    { href: "/pricing", label: "Pricing" },
  ];

  const roleLinks: Record<string, { href: string; label: string }[]> = {
    WORKER: [
      { href: "/worker/dashboard", label: "Dashboard" },
      { href: "/jobs", label: "Browse Jobs" },
      { href: "/worker/applications", label: "Applications" },
      { href: "/worker/profile", label: "Profile" },
    ],
    EMPLOYER: [
      { href: "/employer/dashboard", label: "Dashboard" },
      { href: "/employer/jobs/new", label: "Post Job" },
      { href: "/employer/jobs", label: "My Jobs" },
      { href: "/employer/payments", label: "Plans" },
      { href: "/employer/profile", label: "Profile" },
    ],
    ADMIN: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/jobs", label: "Jobs" },
      { href: "/admin/reports", label: "Reports" },
    ],
  };

  const links = user && roleLinks[user.role] ? roleLinks[user.role] : publicLinks;
  const dashboardHref = user
    ? user.role === "WORKER"
      ? "/worker/dashboard"
      : user.role === "EMPLOYER"
        ? "/employer/dashboard"
        : "/admin/dashboard"
    : "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs transition-transform duration-150 group-hover:scale-105">
              W
            </div>
            <span className="font-semibold text-sm tracking-tight">Workforce</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150",
                  pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1">
              <Link
                href={dashboardHref}
                className="relative p-2 rounded-md hover:bg-accent transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                {(user.unreadNotifications ?? 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full" />
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-md hover:bg-accent transition-colors">
                    <Avatar fallback={user.name || user.role} size="sm" />
                    <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden lg:block">
                      {user.name || user.role}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={user.role === "WORKER" ? "/worker/profile" : "/employer/profile"}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action="/api/logout" method="post" className="cursor-pointer">
                      <button type="submit" className="flex items-center w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t mt-3">
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
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar fallback={user.name || user.role} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
                <form action="/api/logout" method="post">
                  <Button variant="outline" size="sm" className="w-full" type="submit">Logout</Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
