import * as Sentry from "@sentry/nextjs";

const release =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  `workforce@${process.env.npm_package_version || "0.1.0"}`;

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
