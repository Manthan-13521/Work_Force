import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const failureRate = new Rate("failures");
const otpLatency = new Trend("otp_latency");
const browseLatency = new Trend("browse_latency");

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    failures: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { "health ok": (r) => r.status === 200 });
  browseLatency.add(res.timings.duration);
  failureRate.add(res.status !== 200);

  const phone = `9${String(5000000000 + Math.floor(Math.random() * 10000000))}`;
  const otpRes = http.post(`${BASE_URL}/api/otp/send`, JSON.stringify({ phone }), {
    headers: { "Content-Type": "application/json" },
  });
  check(otpRes, { "otp send ok": (r) => r.status === 200 || r.status === 429 });
  otpLatency.add(otpRes.timings.duration);
  failureRate.add(otpRes.status !== 200 && otpRes.status !== 429);

  sleep(1);
}
