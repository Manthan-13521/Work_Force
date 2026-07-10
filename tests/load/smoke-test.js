/**
 * Runtime Validation — k6 Smoke Test
 *
 * Purpose: Validates core business flows under concurrent load.
 * Distinguishes between expected responses (307 redirect, 429 rate limit)
 * and real failures (5xx, unexpected 4xx).
 *
 * Architecture:
 *   - k6 handles HTTP concurrency and metrics
 *   - Business invariants run as a separate Node.js process post-scenario
 *   - Combined reporting produces the certification report
 *
 * How to extend:
 *   Add new flow steps following the group() pattern.
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

/* ───────── Custom metrics ───────── */

const serverErrorRate = new Rate("server_errors");
const expectedRedirectRate = new Rate("expected_redirects");
const rateLimitedRate = new Rate("rate_limited");
const businessFailureRate = new Rate("business_failures");
const otpLatency = new Trend("otp_latency");
const browseLatency = new Trend("browse_latency");
const searchLatency = new Trend("search_latency");
const apiLatency = new Trend("api_latency");

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "20s", target: 100 },
    { duration: "30s", target: 100 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    server_errors: ["rate<0.01"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<5000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

/* ───────── Main scenario ───────── */

export default function () {
  const vu = __VU;

  group("health check", () => {
    const res = http.get(`${BASE_URL}/api/health`);
    const ok = res.status === 200;
    check(res, { "health status 200": (_r) => ok });
    serverErrorRate.add(res.status >= 500);
    apiLatency.add(res.timings.duration);
    sleep(0.5);
  });

  group("browse public pages", () => {
    const pages = ["/", "/jobs", "/workers", "/pricing", "/contact"];
    for (const page of pages) {
      const res = http.get(`${BASE_URL}${page}`);
      const ok = res.status === 200;
      check(res, { [`${page} status 200`]: (_r) => ok });
      serverErrorRate.add(res.status >= 500);
      browseLatency.add(res.timings.duration);
      sleep(0.2);
    }
  });

  group("login flow", () => {
    const phone = `9${String(5000000000 + (vu * 10000 + Date.now() % 10000))}`;
    const otpRes = http.post(
      `${BASE_URL}/api/otp/send`,
      JSON.stringify({ phone }),
      { headers: { "Content-Type": "application/json" } }
    );
    const rateLimited = otpRes.status === 429;
    const success = otpRes.status === 200;
    check(otpRes, { "OTP accepted or rate limited": (_r) => success || rateLimited });
    rateLimitedRate.add(rateLimited);
    serverErrorRate.add(otpRes.status >= 500);
    otpLatency.add(otpRes.timings.duration);
    sleep(1);
  });

  group("protected API routes", () => {
    // These require auth — 307 redirect is expected behavior
    const apiEndpoints = [
      { url: `${BASE_URL}/api/jobs`, name: "jobs_api" },
      { url: `${BASE_URL}/api/plans`, name: "plans_api" },
    ];

    for (const ep of apiEndpoints) {
      const res = http.get(ep.url);
      const redirectOk = res.status === 307;
      const serverErr = res.status >= 500;
      check(res, { [`${ep.name} redirects to login`]: (_r) => redirectOk });
      expectedRedirectRate.add(redirectOk);
      serverErrorRate.add(serverErr);
      apiLatency.add(res.timings.duration);
      sleep(0.3);
    }
  });

  group("search jobs (public endpoint)", () => {
    const searchTerms = ["welder", "factory", "driver", "security", "cook"];
    const term = searchTerms[vu % searchTerms.length];
    const res = http.get(`${BASE_URL}/api/jobs?search=${encodeURIComponent(term)}`);
    const redirectOk = res.status === 307;
    const serverErr = res.status >= 500;
    check(res, { [`search redirects to login`]: (_r) => redirectOk });
    expectedRedirectRate.add(redirectOk);
    serverErrorRate.add(serverErr);
    searchLatency.add(res.timings.duration);
    sleep(0.3);
  });
}

/* ───────── Summary handler ───────── */

export function handleSummary(data) {
  const metrics = data.metrics;
  const serverErrRate = metrics.server_errors
    ? metrics.server_errors.values.rate
    : 0;
  const checks = metrics.checks.values;

  const summary = {
    phase: "smoke",
    timestamp: new Date().toISOString(),
    durationMs: data.state.testRunDurationMs,
    metrics: {
      http: {
        avgDuration: metrics.http_req_duration.values.avg,
        p95Duration: metrics.http_req_duration.values["p(95)"],
        p99Duration: metrics.http_req_duration.values["p(99)"],
        failRate: metrics.http_req_failed.values.rate,
      },
      business: {
        serverErrorRate: serverErrRate,
        expectedRedirects: metrics.expected_redirects
          ? metrics.expected_redirects.values.rate
          : 0,
        rateLimited: metrics.rate_limited
          ? metrics.rate_limited.values.rate
          : 0,
        browseLatencyP95: metrics.browse_latency
          ? metrics.browse_latency.values["p(95)"]
          : 0,
        searchLatencyP95: metrics.search_latency
          ? metrics.search_latency.values["p(95)"]
          : 0,
        otpLatencyP95: metrics.otp_latency
          ? metrics.otp_latency.values["p(95)"]
          : 0,
      },
      checks: {
        total: checks.total || 0,
        passes: checks.passes || 0,
        fails: checks.fails || 0,
      },
      iterations: metrics.iterations.values.count,
      vus: metrics.vus.values.max,
    },
    verdict: serverErrRate < 0.01 ? "PASS" : "FAIL",
  };

  // Write detailed results
  const output = {
    ...summary,
    thresholds: Object.fromEntries(
      Object.entries(metrics).map(([name, metric]) => [
        name,
        metric.thresholds || {},
      ])
    ),
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    "tests/reporting/smoke-results.json": JSON.stringify(output, null, 2),
  };
}
