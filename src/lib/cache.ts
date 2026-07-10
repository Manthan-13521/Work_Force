import {
  cached as newCached,
  invalidateKey as newInvalidateKey,
  cacheKey as newCacheKey,
  Tags as NewTags,
} from "./cache/index";
import type { CacheOptions as NewCacheOptions } from "./cache/index";

export {
  cachedReact,
  invalidateTag,
  invalidateTags,
  getInvalidationLog,
  tagKey,
  metricKey,
  memoryGet,
  memorySet,
  memoryDel,
  memoryClear,
  memorySize,
  dedup,
  memoize,
  cacheMetrics,
} from "./cache/index";

export type { SwrResult, Tag } from "./cache/index";

const DEFAULT_TTL = 300;

export interface LegacyCacheOptions {
  ttl?: number;
  tags?: string[];
}

export async function cached<T>(
  key: string,
  fetch: () => Promise<T>,
  opts: LegacyCacheOptions = {}
): Promise<T> {
  const ttl = opts.ttl ?? DEFAULT_TTL;
  return newCached(key, fetch, { freshTtl: ttl, staleTtl: ttl * 2, tags: opts.tags });
}

export function invalidateCache(key: string) {
  newInvalidateKey(key);
}

export function cacheKey(prefix: string, ...parts: (string | undefined)[]) {
  return newCacheKey(prefix, ...parts);
}

export const Tags = NewTags;
export type CacheOptions = NewCacheOptions;
