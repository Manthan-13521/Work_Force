import { env } from "@/env";
import { logger } from "@/lib/logger";
import type { AnalyticsProvider, AnalyticsUser, PageView } from "./types";
import { posthogProvider } from "./providers/posthog";
import { vercelProvider } from "./providers/vercel";
import { sentryProvider } from "./providers/sentry";

let providers: AnalyticsProvider[] = [];
let initialized = false;

function getProviders(): AnalyticsProvider[] {
  if (providers.length > 0) return providers;

  const active: AnalyticsProvider[] = [];

  if (!env.FEATURE_DISABLE_ANALYTICS) {
    active.push(posthogProvider);
    active.push(vercelProvider);
    active.push(sentryProvider);
  }

  providers = active;
  return providers;
}

function isEnabled(): boolean {
  return !env.FEATURE_DISABLE_ANALYTICS;
}

export async function initAnalytics() {
  if (initialized) return;
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.init();
    } catch (e) {
      logger.warn(`Analytics init failed for ${provider.name}`, { error: String(e) });
    }
  }
  initialized = true;
}

export async function identify(user: AnalyticsUser) {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.identify(user);
    } catch {
      // Best-effort per provider
    }
  }
}

export async function group(group: { id: string; name?: string; attributes?: Record<string, unknown> }) {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.group?.(group);
    } catch {
      // Best-effort
    }
  }
}

export async function pageView(view: PageView) {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.pageView(view);
    } catch {
      // Best-effort
    }
  }
}

export async function track(event: string, properties?: Record<string, unknown>) {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.track(event, properties);
    } catch {
      // Best-effort
    }
  }
}

export async function alias(userId: string, previousId: string) {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.alias?.(userId, previousId);
    } catch {
      // Best-effort
    }
  }
}

export async function resetAnalytics() {
  if (!isEnabled()) return;

  for (const provider of getProviders()) {
    try {
      await provider.reset?.();
    } catch {
      // Best-effort
    }
  }
}

export function getAnalyticsProviders(): string[] {
  return getProviders().map((p) => p.name);
}
