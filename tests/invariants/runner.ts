/**
 * Invariant Runner
 *
 * Purpose: Orchestrates all invariant assertions and produces a structured
 * result set suitable for CI reporting and post-processing.
 *
 * Architecture:
 *   - runAllInvariants: runs every invariant in the library
 *   - runInvariants: runs a specified subset
 *   - Each invariant returns InvariantResult with pass/fail + diagnostic info
 *
 * How to extend:
 *   Add new invariant functions to the allInvariants array in this file.
 *   Each function should accept (prisma, options?) and return Promise<InvariantResult>.
 */

import type { PrismaClient } from "@prisma/client";
import * as payment from "./payment";
import * as credits from "./credits";
import * as auth from "./auth";
import * as jobs from "./jobs";
import * as tenants from "./tenants";
import * as applications from "./applications";
import * as database from "./database";

export interface InvariantResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface InvariantOptions {
  userId?: string;
  paymentId?: string;
  tenantAId?: string;
  tenantBId?: string;
  jobId?: string;
  phone?: string;
  employerId?: string;
  razorpayPaymentId?: string;
}

type InvariantFn = (
  prisma: PrismaClient,
  options?: InvariantOptions
) => Promise<InvariantResult>;

function wrap(
  name: string,
  fn: (prisma: PrismaClient, options: InvariantOptions) => Promise<void>
): InvariantFn {
  return async (prisma: PrismaClient, options?: InvariantOptions): Promise<InvariantResult> => {
    const start = performance.now();
    try {
      await fn(prisma, options ?? {});
      return { name, passed: true, durationMs: performance.now() - start };
    } catch (e) {
      return {
        name,
        passed: false,
        durationMs: performance.now() - start,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };
}

const allInvariants: InvariantFn[] = [
  wrap("payment.processedOnce", (p, o) => payment.assertPaymentProcessedExactlyOnce(p, o.paymentId ?? "" )),
  wrap("payment.creditsGrantedOnce", (p, o) => payment.assertCreditsGrantedExactlyOnce(p, o.userId ?? "", o.paymentId ?? "")),
  wrap("payment.amountMatchesPlan", (p, o) => payment.assertPaymentAmountMatchesPlan(p, o.paymentId ?? "")),
  wrap("payment.webhookReplayImpossible", (p, o) => payment.assertWebhookReplayImpossible(p, o.razorpayPaymentId ?? "")),
  wrap("credits.grantedMinusConsumed", (p, o) => credits.assertGrantedMinusConsumedEqualsRemaining(p, o.employerId)),
  wrap("credits.neverNegative", (p) => credits.assertCreditsNeverNegative(p)),
  wrap("credits.expiryNeverShortens", (p, o) => credits.assertExpiryNeverShortens(p, o.employerId)),
  wrap("auth.otpSingleUse", () => auth.assertOTPSingleUse()),
  wrap("auth.otpReplayImpossible", () => auth.assertOTPReplayImpossible()),
  wrap("auth.logoutInvalidatesSession", () => auth.assertLogoutInvalidatesSession()),
  wrap("jobs.inactiveHiddenFromPublic", (p) => jobs.assertInactiveJobsHiddenFromPublic(p)),
  wrap("jobs.ownerAccessPrivateJobs", (p, o) => jobs.assertOnlyOwnerOrAdminAccessPrivateJobs(p, o.jobId)),
  wrap("jobs.applicationCountCorrect", (p, o) => jobs.assertApplicationCountCorrect(p, o.jobId)),
  wrap("tenants.cannotReadOtherTenant", (p, o) => tenants.assertTenantCannotReadAnother(p, o.tenantAId, o.tenantBId)),
  wrap("tenants.cannotModifyOtherTenant", (p, o) => tenants.assertTenantCannotModifyAnother(p, o.tenantAId, o.tenantBId)),
  wrap("tenants.adminBypassOnlyWhereIntended", (p) => tenants.assertAdminBypassOnlyWhereIntended(p)),
  wrap("applications.uniquePerJobWorker", (p) => applications.assertUniquePerJobWorker(p)),
  wrap("applications.statusTransitionValid", (p) => applications.assertStatusTransitionValid(p)),
  wrap("database.noOrphanRows", (p) => database.assertNoOrphanRows(p)),
  wrap("database.transactionRollbackComplete", (p) => database.assertTransactionRollbackComplete(p)),
  wrap("database.ledgerConsistent", (p) => database.assertLedgerConsistent(p)),
];

export async function runAllInvariants(
  prisma: PrismaClient,
  options?: InvariantOptions
): Promise<InvariantResult[]> {
  const results: InvariantResult[] = [];
  for (const invariant of allInvariants) {
    results.push(await invariant(prisma, options));
  }
  return results;
}

export async function runInvariants(
  prisma: PrismaClient,
  names: string[],
  options?: InvariantOptions
): Promise<InvariantResult[]> {
  const nameSet = new Set(names);
  const selected = allInvariants.filter(
    (_, _i) => nameSet.size === 0
  );
  if (names.length > 0 && selected.length === 0) {
    throw new Error(`No invariants matched names: ${names.join(", ")}`);
  }
  const results: InvariantResult[] = [];
  const toRun = selected.length > 0 ? selected : allInvariants;
  for (const invariant of toRun) {
    results.push(await invariant(prisma, options));
  }
  return results;
}
