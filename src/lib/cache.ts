import { redis } from "./redis";
import { logger } from "./logger";

const DEFAULT_TTL = 300;

type CacheOptions = {
  ttl?: number;
  tags?: string[];
};

const cacheHits = { hit: 0, miss: 0 };

export function getCacheStats() {
  const total = cacheHits.hit + cacheHits.miss;
  return {
    hits: cacheHits.hit,
    misses: cacheHits.miss,
    ratio: total > 0 ? (cacheHits.hit / total * 100).toFixed(1) + "%" : "0%",
  };
}

export async function cached<T>(
  key: string,
  fetch: () => Promise<T>,
  opts: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = opts;

  if (redis) {
    try {
      const cached = await redis.get<string>(key);
      if (cached !== null) {
        cacheHits.hit++;
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis unavailable — fall through
    }
  }

  cacheHits.miss++;
  const result = await fetch();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(result), { ex: ttl });
    } catch {
      logger.warn("Cache set failed", { key });
    }
  }

  return result;
}

export async function invalidateCache(key: string) {
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // Best-effort
    }
  }
}

export function cacheKey(prefix: string, ...parts: (string | undefined)[]): string {
  return `cache:${prefix}:${parts.filter(Boolean).join(":")}`;
}
