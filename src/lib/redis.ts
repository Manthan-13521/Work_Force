import { Redis } from "@upstash/redis";
import { env } from "@/env";
import { logger } from "./logger";

function createRedisClient() {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  if (env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    logger.warn("UPSTASH_REDIS not configured — rate limiting and OTP storage will use per-instance in-memory fallback");
  }
  return null;
}

export const redis = createRedisClient();

const MAX_MEMORY_STORE_ENTRIES = 10_000;
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

let redisFallbackLogged = false;

function logRedisFallback(op: string) {
  if (!redisFallbackLogged) {
    redisFallbackLogged = true;
    logger.warn("Redis unavailable — falling back to in-memory store", { op });
  }
}

function evictMemoryStore() {
  if (memoryStore.size >= MAX_MEMORY_STORE_ENTRIES) {
    const key = memoryStore.keys().next().value;
    if (key) memoryStore.delete(key);
  }
}

export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      logRedisFallback("set");
    }
  }
  evictMemoryStore();
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function redisGet(key: string): Promise<string | null> {
  if (redis) {
    try {
      const result = await redis.get<string>(key);
      if (result === null) return null;
      return String(result);
    } catch {
      logRedisFallback("get");
    }
  }
  const record = memoryStore.get(key);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return record.value;
}

export async function redisDel(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch {
      logRedisFallback("del");
    }
  }
  memoryStore.delete(key);
}

const memoryLocks = new Map<string, Promise<boolean>>();

export async function atomicReadDelete(key: string): Promise<string | null> {
  if (redis) {
    try {
      const result = await redis.getdel<string>(key);
      if (result === null) return null;
      return String(result);
    } catch {
      logRedisFallback("atomicReadDelete");
    }
  }
  const record = memoryStore.get(key);
  if (!record) return null;
  memoryStore.delete(key);
  if (Date.now() > record.expiresAt) return null;
  return record.value;
}

export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      return count <= maxAttempts;
    } catch {
      logRedisFallback("rateLimit");
    }
  }

  const next = (async () => {
    const record = memoryStore.get(key);
    const now = Date.now();

    if (!record || now > record.expiresAt) {
      evictMemoryStore();
      memoryStore.set(key, { value: "1", expiresAt: now + windowSeconds * 1000 });
      return 1 <= maxAttempts;
    }

    const count = parseInt(record.value, 10) + 1;
    memoryStore.set(key, { value: String(count), expiresAt: record.expiresAt });
    return count <= maxAttempts;
  })();

  const prev = memoryLocks.get(key) || Promise.resolve(true);
  const chain = prev.then(() => next);
  chain.finally(() => {
    if (memoryLocks.get(key) === chain) {
      memoryLocks.delete(key);
    }
  });
  memoryLocks.set(key, chain);

  return chain;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// Periodic cleanup of expired in-memory entries (only when Redis is not configured)
if (!redis && typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.expiresAt) memoryStore.delete(key);
    }
  }, 60000);
}
