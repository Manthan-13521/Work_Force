import { Redis } from "@upstash/redis";
import { env } from "@/env";

function createRedisClient() {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export const redis = createRedisClient();

// In-memory fallback for development when Redis is not configured
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redis) {
    await redis.set(key, value, { ex: ttlSeconds });
  } else {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

export async function redisGet(key: string): Promise<string | null> {
  if (redis) {
    return redis.get<string>(key);
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
    await redis.del(key);
  } else {
    memoryStore.delete(key);
  }
}

// Rate limiting: returns true if allowed, false if rate-limited
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  if (redis) {
    const current = await redis.get<number>(key);
    if (current === null) {
      await redis.set(key, 1, { ex: windowSeconds });
      return true;
    }
    if (current >= maxAttempts) return false;
    await redis.incr(key);
    return true;
  }

  // In-memory fallback
  const record = memoryStore.get(key);
  if (!record) {
    memoryStore.set(key, { value: "1", expiresAt: Date.now() + windowSeconds * 1000 });
    return true;
  }
  if (Date.now() > record.expiresAt) {
    memoryStore.set(key, { value: "1", expiresAt: Date.now() + windowSeconds * 1000 });
    return true;
  }
  const count = parseInt(record.value, 10);
  if (count >= maxAttempts) return false;
  memoryStore.set(key, { value: String(count + 1), expiresAt: record.expiresAt });
  return true;
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
