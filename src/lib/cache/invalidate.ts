import { redisStoreDel } from "./redis";
import { memoryDel } from "./memory";
import { cacheKey } from "./keys";
import { logger } from "@/lib/logger";

const invalidationLog: { tag: string; timestamp: number }[] = [];
const MAX_LOG = 100;

export function recordInvalidation(tag: string) {
  invalidationLog.push({ tag, timestamp: Date.now() });
  if (invalidationLog.length > MAX_LOG) invalidationLog.shift();
}

export function getInvalidationLog() {
  return [...invalidationLog];
}

export function invalidateKey(rawKey: string) {
  const fullKey = cacheKey("v2", rawKey);
  memoryDel(fullKey);
  redisStoreDel(fullKey);
}

export async function invalidateTag(tag: string) {
  recordInvalidation(tag);
  const pattern = cacheKey("v2", tag.replace("*", ""));
  memoryDel(pattern);
  logger.info("Cache invalidated", { tag });
}

export async function invalidateTags(tags: string[]) {
  await Promise.all(tags.map((tag) => invalidateTag(tag)));
}
