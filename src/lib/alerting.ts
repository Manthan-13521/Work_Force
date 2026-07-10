import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import { logger } from "@/lib/logger";

type AlertSeverity = "critical" | "warning" | "info";
type AlertChannel = "log" | "sentry" | "webhook";

interface AlertEvent {
  severity: AlertSeverity;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  channel?: AlertChannel[];
}

const DEFAULT_CHANNELS: Record<AlertSeverity, AlertChannel[]> = {
  critical: ["log", "sentry"],
  warning: ["log", "sentry"],
  info: ["log"],
};

export async function sendAlert(event: AlertEvent) {
  const channels = event.channel ?? DEFAULT_CHANNELS[event.severity];
  const entry = { ...event, timestamp: new Date().toISOString() };

  for (const channel of channels) {
    switch (channel) {
      case "log":
        if (event.severity === "critical") logger.error(event.message, event.metadata);
        else if (event.severity === "warning") logger.warn(event.message, event.metadata);
        else logger.info(event.message, event.metadata);
        break;
      case "sentry":
        try {
          const { captureMessage, withScope } = await import("@sentry/nextjs");
          withScope((scope) => {
            scope.setTag("source", event.source);
            scope.setLevel(event.severity === "critical" ? "fatal" : event.severity === "warning" ? "warning" : "info");
            captureMessage(event.message);
          });
        } catch {}
        break;
      case "webhook":
        try {
          const alertWebhook = process.env.ALERT_WEBHOOK_URL;
          if (alertWebhook) {
            await fetch(alertWebhook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(entry),
              signal: AbortSignal.timeout(5000),
            });
          }
        } catch {}
        break;
    }
  }
}

export async function checkDatabaseAlerts() {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    await sendAlert({
      severity: "critical",
      source: "database",
      message: "Database connection failed",
      metadata: { error: String(e) },
    });
  }
}

export async function checkRedisAlerts() {
  try {
    const { redis } = await import("@/lib/redis");
    if (redis) await redis.ping();
  } catch (e) {
    await sendAlert({
      severity: "critical",
      source: "redis",
      message: "Redis connection failed",
      metadata: { error: String(e) },
    });
  }
}

export async function checkWebhookFailure(
  provider: string,
  error: string,
  metadata?: Record<string, unknown>,
) {
  await sendAlert({
    severity: "warning",
    source: `webhook:${provider}`,
    message: `Webhook processing failed for ${provider}`,
    metadata: { error, ...metadata },
  });
}

export async function checkPaymentFailure(
  userId: string,
  error: string,
  metadata?: Record<string, unknown>,
) {
  await sendAlert({
    severity: "warning",
    source: "payment",
    message: `Payment processing failed for user ${userId}`,
    metadata: { error, userId, ...metadata },
  });
}

export async function checkSlowRequest(
  path: string,
  durationMs: number,
  thresholdMs = 5000,
) {
  if (durationMs > thresholdMs) {
    await sendAlert({
      severity: "warning",
      source: "performance",
      message: `Slow request: ${path} took ${durationMs}ms`,
      metadata: { path, durationMs, thresholdMs },
    });
  }
}

export async function checkErrorRate(
  source: string,
  errorCount: number,
  threshold = 10,
) {
  if (errorCount > threshold) {
    await sendAlert({
      severity: "critical",
      source,
      message: `High error rate: ${errorCount} errors in monitoring window`,
      metadata: { errorCount, threshold },
    });
  }
}

export async function checkCacheHitRate(
  hitRate: number,
  threshold = 0.5,
) {
  if (hitRate < threshold) {
    await sendAlert({
      severity: "warning",
      source: "cache",
      message: `Low cache hit rate: ${(hitRate * 100).toFixed(1)}%`,
      metadata: { hitRate, threshold },
    });
  }
}

export async function checkMemoryUsage(
  usedMb: number,
  thresholdMb = 1024,
) {
  if (usedMb > thresholdMb) {
    const pct = ((usedMb / thresholdMb) * 100).toFixed(0);
    await sendAlert({
      severity: "warning",
      source: "memory",
      message: `High memory usage: ${usedMb}MB (${pct}% of threshold)`,
      metadata: { usedMb, thresholdMb },
    });
  }
}

export async function checkEnvConfig() {
  const requiredVars = [
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "JWT_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
  ] as const;

  const missing = requiredVars.filter((key) => !env[key as keyof typeof env]);
  if (missing.length > 0) {
    await sendAlert({
      severity: "critical",
      source: "configuration",
      message: `Missing required environment variables: ${missing.join(", ")}`,
      metadata: { missing },
    });
  }
}
