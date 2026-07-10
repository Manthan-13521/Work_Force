import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/env", () => ({
  env: { UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", NODE_ENV: "test" },
}));

vi.mock("./logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { checkRateLimit, redisSet, redisGet, redisDel } from "./redis";

describe("checkRateLimit (in-memory — TOCTOU-safe)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows first request within window", async () => {
    const result = await checkRateLimit("test:ip-1", 5, 60);
    expect(result).toBe(true);
  });

  it("allows requests up to maxAttempts", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit("test:ip-2", 5, 60);
      expect(result).toBe(true);
    }
  });

  it("blocks requests exceeding maxAttempts", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test:ip-3", 5, 60);
    }
    const result = await checkRateLimit("test:ip-3", 5, 60);
    expect(result).toBe(false);
  });

  it("resets after window expires", async () => {
    await checkRateLimit("test:ip-4", 3, 60);
    await checkRateLimit("test:ip-4", 3, 60);
    await checkRateLimit("test:ip-4", 3, 60);

    vi.advanceTimersByTime(61_000);

    const result = await checkRateLimit("test:ip-4", 3, 60);
    expect(result).toBe(true);
  });
});

describe("redisSet/redisGet/redisDel (in-memory fallback)", () => {
  it("stores and retrieves a value", async () => {
    await redisSet("test:key", "hello", 60);
    const val = await redisGet("test:key");
    expect(val).toBe("hello");
  });

  it("returns null for expired value", async () => {
    vi.useFakeTimers();
    await redisSet("test:expire", "world", 60);
    vi.advanceTimersByTime(61_000);
    const val = await redisGet("test:expire");
    expect(val).toBeNull();
  });

  it("deletes a value", async () => {
    await redisSet("test:del", "todelete", 60);
    await redisDel("test:del");
    const val = await redisGet("test:del");
    expect(val).toBeNull();
  });
});
