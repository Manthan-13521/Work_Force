import { env } from "@/env";

export async function register() {
  if (env.NODE_ENV !== "production") return;

  // env.ts already validates and throws on missing vars in production
  // This hook ensures env validation runs at startup, not lazily
  console.log(`Starting in production mode — ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(`Features: analytics=${!env.FEATURE_DISABLE_ANALYTICS}, notifications=${!env.FEATURE_DISABLE_NOTIFICATIONS}, maintenance=${env.FEATURE_MAINTENANCE_MODE}`);
}
