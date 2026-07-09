import { env } from "@/env";

export function shouldInitializeSentry(): boolean {
  return !!(env.SENTRY_DSN && env.NODE_ENV === "production");
}

export function getSentryDSN(): string | undefined {
  return env.SENTRY_DSN;
}
