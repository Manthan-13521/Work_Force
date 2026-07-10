import { env } from "@/env";
import { logger } from "@/lib/logger";

export async function register() {
  if (env.NODE_ENV !== "production") return;

  logger.info("Starting in production mode", { url: env.NEXT_PUBLIC_APP_URL });
  logger.info("Feature flags", {
    analytics: !env.FEATURE_DISABLE_ANALYTICS,
    notifications: !env.FEATURE_DISABLE_NOTIFICATIONS,
    maintenance: env.FEATURE_MAINTENANCE_MODE,
  });

  // Warm up database connection pool to avoid cold-start latency on first request
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection pool warmed");
  } catch (e) {
    logger.error("Database warmup failed", { error: String(e) });
  }
}
