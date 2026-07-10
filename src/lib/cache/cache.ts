import { cache } from "react";
import { dedup } from "./helpers";
import { memoryGet, memorySet, memoryDel } from "./memory";
import { redisStoreGet, redisStoreSet, redisStoreDel } from "./redis";
import { cacheMetrics } from "./metrics";
import { cacheKey } from "./keys";
import { logger } from "@/lib/logger";

export interface CacheOptions {
  freshTtl?: number;
  staleTtl?: number;
  tags?: string[];
  dedupKey?: string;
}

export type SwrResult<T> = { data: T; stale: boolean };

const DEFAULT_FRESH_TTL = 300;
const DEFAULT_STALE_TTL = 900;

const memoryTtlMs = (ttl: number) => Math.min(ttl * 1000, 30_000);

function isFresh(entry: { storedAt: number; freshTtl: number }): boolean {
  return Date.now() - entry.storedAt < entry.freshTtl * 1000;
}

function isStale(entry: { storedAt: number; freshTtl: number; staleTtl: number }): boolean {
  const age = Date.now() - entry.storedAt;
  return age >= entry.freshTtl * 1000 && age < entry.staleTtl * 1000;
}

const refreshesInFlight = new Map<string, Promise<unknown>>();

async function backgroundRefresh<T>(key: string, fetch: () => Promise<T>): Promise<void> {
  if (refreshesInFlight.has(key)) return;
  const promise = fetch()
    .then((data) => {
      const serialized = JSON.stringify(data);
      const freshTtl = DEFAULT_FRESH_TTL;
      const entry = JSON.stringify({ data: serialized, storedAt: Date.now(), freshTtl, staleTtl: DEFAULT_STALE_TTL });
      memorySet(key, entry, memoryTtlMs(DEFAULT_STALE_TTL * 1000));
      redisStoreSet(key, entry, DEFAULT_STALE_TTL).catch(() => {});
      cacheMetrics.refresh();
    })
    .catch((err) => {
      logger.warn("Background refresh failed", { key, error: String(err) });
    })
    .finally(() => {
      refreshesInFlight.delete(key);
    });
  refreshesInFlight.set(key, promise);
  await promise;
}

export function cached<T>(
  key: string,
  fetch: () => Promise<T>,
  opts: CacheOptions = {},
): Promise<T> {
  const { freshTtl = DEFAULT_FRESH_TTL, staleTtl = DEFAULT_STALE_TTL, dedupKey } = opts;
  const fullKey = cacheKey("v2", key);

  const executor = dedup<T>(dedupKey || fullKey, async () => {
    const memoryEntry = memoryGet(fullKey);
    if (memoryEntry) {
      try {
        const parsed = JSON.parse(memoryEntry);
        const entryData = JSON.parse(parsed.data);
        if (isFresh(parsed)) {
          cacheMetrics.hit();
          return entryData as T;
        }
        if (isStale(parsed)) {
          cacheMetrics.hit();
          backgroundRefresh(fullKey, fetch);
          return entryData as T;
        }
      } catch {
        memoryDel(fullKey);
      }
    }

    const redisEntry = await redisStoreGet(fullKey);
    if (redisEntry) {
      try {
        const parsed = JSON.parse(redisEntry);
        const entryData = JSON.parse(parsed.data);
        if (isFresh(parsed)) {
          memorySet(fullKey, redisEntry, memoryTtlMs(staleTtl));
          cacheMetrics.hit();
          return entryData as T;
        }
        if (isStale(parsed)) {
          memorySet(fullKey, redisEntry, memoryTtlMs(staleTtl));
          cacheMetrics.hit();
          backgroundRefresh(fullKey, fetch);
          return entryData as T;
        }
      } catch {
        redisStoreDel(fullKey);
      }
    }

    cacheMetrics.miss();
    const data = await fetch();
    const serialized = JSON.stringify(data);
    const entry = JSON.stringify({ data: serialized, storedAt: Date.now(), freshTtl, staleTtl });
    memorySet(fullKey, entry, memoryTtlMs(staleTtl));
    redisStoreSet(fullKey, entry, staleTtl);

    return data;
  });

  return executor;
}

export function cachedReact<T>(fn: () => Promise<T>): () => Promise<T> {
  return cache(fn);
}
