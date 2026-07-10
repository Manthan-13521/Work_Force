import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { env } from "@/env";

export async function GET() {
  const checks: Record<string, boolean | string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (e) {
    checks.database = String(e);
  }

  if (redis) {
    try {
      await redis.ping();
      checks.redis = true;
    } catch (e) {
      checks.redis = String(e);
    }
  } else {
    checks.redis = "not_configured";
  }

  const required = ["DATABASE_URL", "NEXT_PUBLIC_APP_URL", "JWT_SECRET"] as const;
  const missing = required.filter((k) => !env[k as keyof typeof env]);
  checks.environment = missing.length === 0 || `missing: ${missing.join(", ")}`;

  const allOk = Object.values(checks).every((v) => v === true);

  return NextResponse.json(
    { ready: allOk, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
