/**
 * Business Invariant Library
 *
 * Purpose: Reusable runtime assertions that certify production correctness
 * through execution instead of static inspection.
 *
 * Architecture: Each module exports async assertion functions that accept a
 * PrismaClient (and optionally Redis client). Assertions throw loud descriptive
 * errors on failure. All modules are re-exported through this index.
 *
 * How to extend:
 *   1. Create a new file in tests/invariants/<domain>.ts
 *   2. Export async assert* functions following the same signature pattern
 *   3. Re-export from this index
 *   4. Import runAllInvariants from ./runner for CI integration
 *
 * How it integrates:
 *   - Vitest: import { assertPaymentProcessed } from "@/tests/invariants" (via tsconfig paths)
 *   - k6 post-process: node -e "require('./runner').runAllInvariants(...)" after each scenario
 *   - CI: called by the certification step after integration tests
 */

export * from "./payment";
export * from "./credits";
export * from "./auth";
export * from "./jobs";
export * from "./tenants";
export * from "./applications";
export * from "./database";
export { runAllInvariants, runInvariants, type InvariantResult } from "./runner";
