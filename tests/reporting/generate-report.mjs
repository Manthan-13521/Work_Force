/**
 * Certification Report Generator
 *
 * Purpose: Combines k6 smoke test results + invariant test results into
 * a single machine-readable certification report for CI/CD consumption.
 *
 * Architecture:
 *   - Reads smoke-results.json from the k6 test
 *   - Reads certification-report.json from vitest invariants
 *   - Produces a unified report with categorized failures
 *   - Returns exit code 0 (pass) or 1 (fail)
 *
 * How to extend:
 *   Add new data sources (e.g., penetration test results, lighthouse scores)
 *   by extending the gatherResults() function.
 *
 * Integration:
 *   Called by `npm run certify` after the smoke + invariant tests complete.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_DIR = path.resolve(__dirname);
const SMOKE_RESULTS = path.join(REPORT_DIR, "smoke-results.json");
const INVARIANT_RESULTS = path.join(REPORT_DIR, "certification-report.json");
const OUTPUT_REPORT = path.join(REPORT_DIR, "certification-report-final.json");

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function categorizeFailures(invariantData) {
  if (!invariantData) return { performance: [], business: [], infrastructure: [] };

  const failures = {
    performance: [],
    business: [],
    infrastructure: [],
  };

  const testResults = invariantData.testResults || [];
  for (const test of testResults) {
    if (test.status === "failed") {
      const name = test.name || test.fullName || "unknown";
      if (
        name.includes("payment") ||
        name.includes("credit") ||
        name.includes("auth") ||
        name.includes("otp") ||
        name.includes("tenant") ||
        name.includes("job") ||
        name.includes("application")
      ) {
        failures.business.push({ name, error: test.failureMessage });
      } else if (name.includes("database") || name.includes("ledger")) {
        failures.infrastructure.push({ name, error: test.failureMessage });
      } else {
        failures.business.push({ name, error: test.failureMessage });
      }
    }
  }

  return failures;
}

function generateReport() {
  const smokeData = readJSON(SMOKE_RESULTS);
  const invariantData = readJSON(INVARIANT_RESULTS);

  const failures = categorizeFailures(invariantData);

  const report = {
    phase: "certification",
    timestamp: new Date().toISOString(),
    summary: {
      passed: true,
      smoke: {
        passed: smokeData ? smokeData.passed !== false : false,
        p95: smokeData?.p95 || 0,
        failRate: smokeData?.failRate || 1,
      },
      invariants: {
        total: invariantData?.testResults?.length || 0,
        passed: invariantData?.testResults
          ? invariantData.testResults.filter((t) => t.status === "passed").length
          : 0,
        failed: invariantData?.testResults
          ? invariantData.testResults.filter((t) => t.status === "failed").length
          : 0,
      },
      failures,
    },
    smoke: smokeData || null,
    invariants: invariantData || null,
  };

  const _hasPerformanceFailures = failures.performance.length > 0;
  const hasBusinessFailures = failures.business.length > 0;
  const hasInfrastructureFailures = failures.infrastructure.length > 0;

  report.summary.passed =
    !hasBusinessFailures &&
    !hasInfrastructureFailures &&
    (smokeData ? smokeData.passed !== false : false);

  fs.writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));

  if (!report.summary.passed) {
    console.error("CERTIFICATION FAILED");
    if (hasBusinessFailures) {
      console.error("  Business correctness failures detected — deployment blocked.");
    }
    if (hasInfrastructureFailures) {
      console.error("  Infrastructure integrity failures detected — deployment blocked.");
    }
    process.exit(1);
  }

  console.log("CERTIFICATION PASSED");
}

generateReport();
