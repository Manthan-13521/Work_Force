const MAX_CONTEXT_ENTRIES = 10_000;
const MAX_METRIC_BUCKET_KEYS = 100;

let requestIdCounter = 0;

export function generateRequestId(): string {
  requestIdCounter = (requestIdCounter + 1) % 1000000;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}-${requestIdCounter}`;
}

const requestContextStore = new Map<string, Record<string, string>>();

export function setRequestContext(requestId: string, ctx: Record<string, string>) {
  if (requestContextStore.size >= MAX_CONTEXT_ENTRIES) {
    const key = requestContextStore.keys().next().value;
    if (key) requestContextStore.delete(key);
  }
  requestContextStore.set(requestId, ctx);
}

export function getRequestContext(requestId: string): Record<string, string> | undefined {
  return requestContextStore.get(requestId);
}

export function clearRequestContext(requestId: string) {
  requestContextStore.delete(requestId);
}

const metricBuckets = new Map<string, number[]>();

export function recordLatency(name: string, durationMs: number) {
  if (metricBuckets.size >= MAX_METRIC_BUCKET_KEYS) return;
  const bucket = metricBuckets.get(name) || [];
  bucket.push(durationMs);
  if (bucket.length > 1000) bucket.shift();
  metricBuckets.set(name, bucket);
}

export function getLatencyStats(name: string): { count: number; avg: number; p50: number; p95: number; p99: number } | null {
  const bucket = metricBuckets.get(name);
  if (!bucket || bucket.length === 0) return null;
  const sorted = [...bucket].sort((a, b) => a - b);
  const len = sorted.length;
  return {
    count: len,
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
  };
}
