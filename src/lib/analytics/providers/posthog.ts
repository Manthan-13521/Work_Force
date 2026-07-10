import type { AnalyticsProvider, AnalyticsUser, PageView } from "../types";

type PostHogClient = {
  init: (apiKey: string, options?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  opt_out_capturing: () => void;
};

type PostHogServer = {
  identify: (options: { distinctId: string; properties?: Record<string, unknown> }) => void;
  capture: (options: { distinctId: string; event: string; properties?: Record<string, unknown> }) => void;
  flush: () => Promise<void>;
};

let clientInstance: PostHogClient | null = null;
let serverClient: PostHogServer | null = null;

function getClient(): PostHogClient | null {
  if (clientInstance) return clientInstance;
  try {
    const posthog = require("posthog-js") as unknown as { // eslint-disable-line @typescript-eslint/no-require-imports
      init: (key: string, options?: Record<string, unknown>) => PostHogClient;
    };
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";
    if (apiKey) {
      posthog.init(apiKey, {
        api_host: apiHost,
        capture_pageview: false,
        capture_pageleave: false,
        persistence: "localStorage",
      });
      clientInstance = posthog as unknown as PostHogClient;
    }
  } catch {
    // posthog-js unavailable
  }
  return clientInstance;
}

function getServer(): PostHogServer | null {
  if (serverClient) return serverClient;
  try {
    const { PostHog } = require("posthog-node") as typeof import("posthog-node"); // eslint-disable-line @typescript-eslint/no-require-imports
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (apiKey) {
      serverClient = new PostHog(apiKey, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      }) as unknown as PostHogServer;
    }
  } catch {
    // posthog-node unavailable
  }
  return serverClient;
}

export const posthogProvider: AnalyticsProvider = {
  name: "posthog",

  init() {
    if (typeof window !== "undefined") {
      getClient();
    }
  },

  identify(user: AnalyticsUser) {
    const distinctId = user.id;
    try {
      const client = getClient();
      if (client) {
        client.identify(distinctId, {
          role: user.role,
          email: user.email,
          name: user.name,
        });
      }
      const server = getServer();
      if (server) {
        server.identify({
          distinctId,
          properties: {
            role: user.role,
            email: user.email,
            name: user.name,
          },
        });
      }
    } catch {
      // Best-effort
    }
  },

  pageView(view: PageView) {
    try {
      const client = getClient();
      if (client) {
        client.capture("$pageview", {
          $current_url: view.path,
          $referrer: view.referrer,
          $title: view.title,
        });
      }
    } catch {
      // Best-effort
    }
  },

  track(event: string, properties?: Record<string, unknown>) {
    try {
      const client = getClient();
      if (client) {
        client.capture(event, properties);
      }
      const server = getServer();
      if (server) {
        server.capture({
          distinctId: (properties?.distinctId as string) || "anonymous",
          event,
          properties,
        });
      }
    } catch {
      // Best-effort
    }
  },

  reset() {
    try {
      const client = getClient();
      if (client) {
        client.reset();
      }
    } catch {
      // Best-effort
    }
  },
};
