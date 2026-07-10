import * as Sentry from "@sentry/nextjs";
import type { AnalyticsProvider } from "../types";

export const sentryProvider: AnalyticsProvider = {
  name: "sentry",

  init() {
    // Sentry is initialized in sentry.client.config.ts / sentry.server.config.ts
  },

  identify(user: { id: string; role?: string; name?: string }) {
    try {
      Sentry.setUser({
        id: user.id,
        role: user.role,
        username: user.name,
      });
    } catch {
      // Best-effort
    }
  },

  pageView() {
    try {
      Sentry.addBreadcrumb({
        category: "navigation",
        message: "Page view",
        level: "info",
      });
    } catch {
      // Best-effort
    }
  },

  track(event: string, properties?: Record<string, unknown>) {
    try {
      Sentry.addBreadcrumb({
        category: "analytics",
        message: event,
        data: properties as Record<string, string | undefined>,
        level: "info",
      });
    } catch {
      // Best-effort
    }
  },
};
