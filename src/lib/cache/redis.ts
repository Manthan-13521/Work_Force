import { redis, redisSet, redisGet, redisDel } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { cacheMetrics } from "./metrics";

export async function redisStoreSet(key: string, data: string, ttlSeconds: number): Promise<void> {
  try {
    await redisSet(key, data, ttlSeconds);
    cacheMetrics.set();
  } catch {
    logger.warn("redisStoreSet failed", { key });
  }
}

export async function redisStoreGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    const val = await redisGet(key);
    if (val !== null) cacheMetrics.hit();
    else cacheMetrics.miss();
    return val;
  } catch {
    logger.warn("redisStoreGet failed", { key });
    return null;
  }
}

export async function redisStoreDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redisDel(key);
  } catch {
    logger.warn("redisStoreDel failed", { key });
  }
}

export async function redisStoreExists(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const val = await redisGet(key);
    return val !== null;
  } catch {
    return false;
  }
}
