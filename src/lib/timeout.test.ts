import { describe, it, expect } from "vitest";
import { withTimeout } from "./timeout";

describe("withTimeout", () => {
  it("resolves if promise completes in time", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000);
    expect(result).toBe("ok");
  });

  it("rejects if promise exceeds timeout", async () => {
    await expect(
      withTimeout(new Promise((r) => setTimeout(r, 200)), 50)
    ).rejects.toThrow(/timed out/i);
  });
});
