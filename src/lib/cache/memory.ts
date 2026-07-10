import { cacheMetrics } from "./metrics";

const MAX_ENTRIES = 5_000;
const store = new Map<string, { data: string; expiresAt: number }>();

function evictOne() {
  if (store.size >= MAX_ENTRIES) {
    const key = store.keys().next().value;
    if (key) {
      store.delete(key);
      cacheMetrics.eviction();
    }
  }
}

export function memoryGet(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    cacheMetrics.eviction();
    return null;
  }
  return entry.data;
}

export function memorySet(key: string, data: string, ttlMs: number): void {
  evictOne();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function memoryDel(key: string): void {
  store.delete(key);
}

export function memoryClear(): void {
  store.clear();
}

export function memorySize(): number {
  return store.size;
}
