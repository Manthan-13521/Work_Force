import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/env";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

type ComponentCheck = {
  status: HealthStatus;
  latencyMs: number;
  error?: string;
};

type HealthResponse = {
  status: HealthStatus;
  timestamp: string;
  components: Record<string, ComponentCheck>;
  environment: string;
  uptime: number;
};

async function checkDb(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (e) {
    return { status: "unhealthy", latencyMs: Date.now() - start, error: String(e) };
  }
}

async function checkRedis(): Promise<ComponentCheck> {
  if (!redis) return { status: "degraded", latencyMs: 0, error: "Not configured" };
  const start = Date.now();
  try {
    await redis.ping();
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (e) {
    return { status: "unhealthy", latencyMs: Date.now() - start, error: String(e) };
  }
}

async function checkEnv(): Promise<ComponentCheck> {
  const start = Date.now();
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "JWT_SECRET",
  ] as const;
  const missing = required.filter((k) => !env[k as keyof typeof env]);
  if (missing.length > 0) {
    return { status: "unhealthy", latencyMs: Date.now() - start, error: `Missing env vars: ${missing.join(", ")}` };
  }
  return { status: "healthy", latencyMs: Date.now() - start };
}

async function checkStorage(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const { execSync } = await import("child_process");
    const output = execSync("df -P / | tail -1 | awk '{print $5}'", { encoding: "utf-8", timeout: 5000 }).trim();
    const pct = parseInt(output.replace("%", ""), 10);
    if (isNaN(pct)) return { status: "degraded", latencyMs: Date.now() - start, error: "Cannot determine disk usage" };
    if (pct > 90) return { status: "degraded", latencyMs: Date.now() - start, error: `Disk at ${pct}%` };
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start, error: "Disk check unavailable in this environment" };
  }
}

const startTime = Date.now();

export async function GET() {
  const [db, cacheComponent, envCheck, storage] = await Promise.all([
    checkDb(),
    checkRedis(),
    checkEnv(),
    checkStorage(),
  ]);

  const components: Record<string, ComponentCheck> = {
    database: db,
    redis: cacheComponent,
    environment: envCheck,
    storage,
  };

  const statuses = Object.values(components).map((c) => c.status);
  let overall: HealthStatus = "healthy";
  if (statuses.includes("unhealthy")) overall = "unhealthy";
  else if (statuses.includes("degraded")) overall = "degraded";

  const response: HealthResponse = {
    status: overall,
    timestamp: new Date().toISOString(),
    components,
    environment: env.NODE_ENV || "development",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  return NextResponse.json(response, {
    status: overall === "unhealthy" ? 503 : 200,
  });
}
