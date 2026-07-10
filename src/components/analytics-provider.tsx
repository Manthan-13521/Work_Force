"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, pageView, identify } from "@/lib/analytics";
import { logger } from "@/lib/logger";

function AnalyticsInner({ user }: { user?: { id: string; role?: string; name?: string } | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    initAnalytics().catch((e) => {
      logger.warn("Analytics init failed", { error: String(e) });
    });
  }, []);

  useEffect(() => {
    if (user?.id) {
      identify({ id: user.id, role: user.role, name: user.name }).catch(() => {});
    }
  }, [user?.id, user?.role, user?.name]);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    const search = searchParams?.toString() || "";
    pageView({
      path: pathname + (search ? `?${search}` : ""),
      title: typeof document !== "undefined" ? document.title : undefined,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      search: search || undefined,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}

interface AnalyticsProviderProps {
  user?: {
    id: string;
    role?: string;
    name?: string;
  } | null;
}

export function AnalyticsProvider({ user }: AnalyticsProviderProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner user={user} />
    </Suspense>
  );
}
