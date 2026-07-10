/**
 * Invariant Integration Test
 *
 * Purpose: Runs all business invariants against the live database via vitest.
 * This is the entry point for CI's "Invariant Tests" stage.
 */
import { describe, it, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { runAllInvariants } from "./runner";

describe("Business Invariants", () => {
  let results: Awaited<ReturnType<typeof runAllInvariants>>;

  beforeAll(async () => {
    results = await runAllInvariants(prisma as any);
  }, 60000);

  it("all invariants pass", () => {
    if (!results || results.length === 0) {
      return;
    }
    const failed = results.filter((r) => !r.passed);
    if (failed.length > 0) {
      const messages = failed.map((r) => `  FAIL: ${r.name} — ${r.error}`);
      throw new Error(
        `${failed.length}/${results.length} invariants failed:\n${messages.join("\n")}`
      );
    }
  });
});
