import { describe, it, expect } from "vitest";
import { CircuitBreaker } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  it("passes through successful calls", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 3, resetTimeoutMs: 1000 });
    const result = await cb.call(async () => "ok");
    expect(result).toBe("ok");
  });

  it("opens after threshold failures", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 2, resetTimeoutMs: 1000 });
    await expect(cb.call(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    await expect(cb.call(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    await expect(cb.call(async () => "ok")).rejects.toThrow("Circuit breaker test is OPEN");
  });

  it("uses fallback when open", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1, resetTimeoutMs: 1000 });
    await expect(cb.call(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    const result = await cb.call(async () => { throw new Error("fail"); }, async () => "fallback");
    expect(result).toBe("fallback");
  });

  it("resets after timeout", async () => {
    const cb = new CircuitBreaker("test", { failureThreshold: 1, resetTimeoutMs: 50 });
    await expect(cb.call(async () => { throw new Error("fail"); })).rejects.toThrow("fail");
    await expect(cb.call(async () => "ok")).rejects.toThrow("Circuit breaker test is OPEN");
    await new Promise((r) => setTimeout(r, 60));
    const result = await cb.call(async () => "ok");
    expect(result).toBe("ok");
  });
});
