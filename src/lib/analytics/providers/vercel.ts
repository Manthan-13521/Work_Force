import type { AnalyticsProvider, PageView } from "../types";

type VercelAnalytics = {
  track: (event: string, properties?: Record<string, string | number | boolean>) => void;
};

let vercelAnalytics: VercelAnalytics | null = null;

function getVercel(): VercelAnalytics | null {
  if (vercelAnalytics) return vercelAnalytics;
  try {
    vercelAnalytics = require("@vercel/analytics") as unknown as VercelAnalytics; // eslint-disable-line @typescript-eslint/no-require-imports
  } catch {
    // @vercel/analytics unavailable
  }
  return vercelAnalytics;
}

export const vercelProvider: AnalyticsProvider = {
  name: "vercel",

  init() {
    // Vercel Analytics auto-initializes
  },

  identify() {
    // Vercel Analytics doesn't support identify
  },

  pageView(view: PageView) {
    try {
      const va = getVercel();
      if (va?.track) {
        va.track("pageview", {
          path: view.path,
          title: view.title || "",
          referrer: view.referrer || "",
        });
      }
    } catch {
      // Best-effort
    }
  },

  track(event: string, properties?: Record<string, unknown>) {
    try {
      const va = getVercel();
      if (va?.track) {
        const safe = Object.fromEntries(
          Object.entries(properties || {}).map(([k, v]) => [
            k,
            typeof v === "string" || typeof v === "number" || typeof v === "boolean"
              ? v
              : String(v),
          ])
        );
        va.track(event, safe);
      }
    } catch {
      // Best-effort
    }
  },
};
