import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { env } from "@/env";

const startTime = Date.now();
const nodeVersion = process.version;
const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development";
const memory = () => Math.round(process.memoryUsage().rss / 1024 / 1024);

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const checks: Record<string, unknown> = {};

  // Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (e) {
    checks.database = { status: "error", latencyMs: Date.now() - start, error: String(e) };
  }

  // Redis
  if (redis) {
    try {
      const redisStart = Date.now();
      await redis.set("__health", "1", { ex: 10 });
      const redisVal = await redis.get("__health");
      checks.redis = { status: redisVal === "1" ? "ok" : "degraded", latencyMs: Date.now() - redisStart };
    } catch (e) {
      checks.redis = { status: "error", error: String(e) };
    }
  } else {
    checks.redis = { status: "unavailable", message: "Using in-memory fallback" };
  }

  // Cloudinary
  if (env.CLOUDINARY_CLOUD_NAME) {
    checks.cloudinary = { status: "configured", cloudName: env.CLOUDINARY_CLOUD_NAME };
  } else {
    checks.cloudinary = { status: "not_configured" };
  }

  // MSG91
  if (env.MSG91_AUTH_KEY) {
    checks.msg91 = { status: "configured" };
  } else {
    checks.msg91 = { status: "not_configured" };
  }

  // Razorpay
  if (env.RAZORPAY_KEY_ID) {
    checks.razorpay = { status: "configured", keyId: env.RAZORPAY_KEY_ID.slice(0, 8) + "..." };
  } else {
    checks.razorpay = { status: "not_configured" };
  }

  // Sentry
  checks.sentry = { status: env.SENTRY_DSN ? "configured" : "not_configured" };

  const degraded = Object.values(checks).some(
    (c: unknown) => (c as Record<string, unknown>).status === "error"
  );

  return NextResponse.json(
    {
      status: degraded ? "degraded" : "ok",
      version: buildVersion,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      nodeVersion,
      memory: `${memory()}MB`,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks,
      durationMs: Date.now() - start,
    },
    { status: degraded ? 503 : 200 }
  );
}
