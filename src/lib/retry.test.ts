import { describe, it, expect, vi } from "vitest";
import { retry } from "./retry";

describe("retry", () => {
  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce("ok");
    const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fail"));
    await expect(retry(fn, { maxAttempts: 2, delayMs: 10 })).rejects.toThrow("always fail");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses default options when none provided", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retry(fn);
    expect(result).toBe("ok");
  });

  it("retries only once with maxAttempts=1", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(retry(fn, { maxAttempts: 1 })).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses increasing delay between retries", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce("ok");
    const start = Date.now();
    await retry(fn, { maxAttempts: 3, delayMs: 50 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it("preserves the last error type on exhaustion", async () => {
    class CustomError extends Error {
      constructor() { super("custom"); this.name = "CustomError"; }
    }
    const fn = vi.fn().mockRejectedValue(new CustomError());
    try {
      await retry(fn, { maxAttempts: 2, delayMs: 5 });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CustomError);
    }
  });

  it("does not delay on the last failed attempt", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const start = Date.now();
    await expect(retry(fn, { maxAttempts: 1, delayMs: 9999 })).rejects.toThrow("fail");
    expect(Date.now() - start).toBeLessThan(100);
  });
});
