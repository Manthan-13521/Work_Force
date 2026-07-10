"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  links: SidebarLink[];
  title?: string;
  subtitle?: string;
  unreadNotifications?: number;
}

export function Sidebar({ links, title = "Workforce", subtitle, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-sidebar-background hidden md:flex flex-col shrink-0">
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs transition-transform duration-150 group-hover:scale-105">
            W
          </div>
          <div>
            <span className="font-semibold text-sm text-sidebar-foreground">{title}</span>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>
            )}
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              <span>{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {unreadNotifications > 0 && (
        <div className="px-2 pb-1">
          <Link
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150"
          >
            <Bell className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Notifications</span>
            <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          </Link>
        </div>
      )}

      <div className="p-2 border-t border-sidebar-border">
        <form action="/api/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-sidebar-foreground/40 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Logout</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
