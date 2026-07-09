import { logger } from "./logger";
import { generateRequestId, setRequestContext, clearRequestContext } from "./tracer";

type MetricValue = {
  count: number;
  totalMs: number;
  failures: number;
  lastLatencyMs: number;
};

const metricsStore = new Map<string, MetricValue>();
let metricsFlushTimer: ReturnType<typeof setInterval> | null = null;

function ensureMetricsFlush() {
  if (metricsFlushTimer) return;
  metricsFlushTimer = setInterval(() => {
    if (metricsStore.size === 0) return;
    const snapshot = new Map(metricsStore);
    metricsStore.clear();
    const entries = Array.from(snapshot.entries()).map(([key, val]) => ({
      metric: key,
      count: val.count,
      avgMs: val.count > 0 ? Math.round(val.totalMs / val.count) : 0,
      failures: val.failures,
      p95Ms: 0,
    }));
    logger.info("Metrics snapshot", { metrics: entries });
  }, 60000);
}

export function recordMetric(name: string, durationMs: number, failed = false) {
  ensureMetricsFlush();
  const existing = metricsStore.get(name) || { count: 0, totalMs: 0, failures: 0, lastLatencyMs: 0 };
  existing.count++;
  existing.totalMs += durationMs;
  existing.lastLatencyMs = durationMs;
  if (failed) existing.failures++;
  metricsStore.set(name, existing);
}

export class ServiceSpan {
  private start: number;
  private name: string;
  private metadata: Record<string, unknown>;

  constructor(name: string, metadata?: Record<string, unknown>) {
    this.start = performance.now();
    this.name = name;
    this.metadata = metadata || {};
  }

  finish(failed = false) {
    const duration = performance.now() - this.start;
    recordMetric(this.name, duration, failed);
    if (duration > 1000) {
      logger.warn("Slow operation detected", {
        operation: this.name,
        durationMs: Math.round(duration),
        ...this.metadata,
      });
    }
  }

  async trace<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.finish(false);
      return result;
    } catch (e) {
      this.finish(true);
      throw e;
    }
  }
}

export function startSpan(name: string, metadata?: Record<string, unknown>): ServiceSpan {
  return new ServiceSpan(name, metadata);
}

export function requestScope(
  path: string,
  method: string,
  userId?: string,
  role?: string
): { requestId: string; cleanup: () => void } {
  const requestId = generateRequestId();
  const ctx: Record<string, string> = { requestId, path, method };
  if (userId) ctx.userId = userId;
  if (role) ctx.role = role;
  setRequestContext(requestId, ctx);

  const scope = typeof globalThis !== "undefined" ? (globalThis as Record<string, unknown>) : null;
  if (scope) scope["__requestId"] = requestId;

  return {
    requestId,
    cleanup: () => {
      clearRequestContext(requestId);
      if (scope) delete scope["__requestId"];
    },
  };
}

let buildVersion = "development";
try {
  buildVersion = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development";
} catch {}

export function getBuildVersion(): string {
  return buildVersion;
}
