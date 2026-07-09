import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "3m", target: 1000 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<10000"],
    http_req_failed: ["rate<0.05"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function runLoadTest() {
  group("browse public pages", () => {
    const pages = ["/", "/jobs", "/workers", "/pricing"];
    for (const page of pages) {
      const res = http.get(`${BASE_URL}${page}`);
      check(res, { [`${page} ok`]: (r) => r.status < 500 });
      sleep(0.5);
    }
  });

  group("browse health endpoints", () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, { "health ok": (r) => r.status < 500 });
  });
}

export function handleSummary(data) {
  return {
    "stdout": JSON.stringify({
      avg: data.metrics.http_req_duration.values.avg,
      p95: data.metrics.http_req_duration.values["p(95)"],
      p99: data.metrics.http_req_duration.values["p(99)"],
      failRate: data.metrics.http_req_failed.values.rate,
    }),
    "k6/load-test-results.json": JSON.stringify(data, null, 2),
  };
}
