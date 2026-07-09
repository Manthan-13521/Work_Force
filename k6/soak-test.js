import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "5m", target: 200 },
    { duration: "10m", target: 400 },
    { duration: "5m", target: 600 },
    { duration: "10m", target: 600 },
    { duration: "5m", target: 200 },
    { duration: "30m", target: 200 },
    { duration: "10m", target: 400 },
    { duration: "30m", target: 400 },
    { duration: "5m", target: 200 },
    { duration: "2h", target: 200 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_AGENT = "k6-soak-test/1.0";

const pages = ["/", "/login", "/register", "/jobs", "/workers", "/pricing"];
const apiEndpoints = ["/api/health", "/api/ready", "/api/live"];

export default function () {
  group("Page browse", () => {
    const page = pages[Math.floor(Math.random() * pages.length)];
    const res = http.get(`${BASE_URL}${page}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { [`${page} 200`]: (r) => r.status === 200 });
    sleep(randomIntBetween(1, 5));
  });

  group("API check", () => {
    const endpoint = apiEndpoints[Math.floor(Math.random() * apiEndpoints.length)];
    const res = http.get(`${BASE_URL}${endpoint}`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { [`${endpoint} 200`]: (r) => r.status === 200 });
    sleep(randomIntBetween(0.5, 2));
  });

  group("OTP attempt", () => {
    const phone = `777777${String(randomIntBetween(1000, 9999))}`;
    const res = http.post(
      `${BASE_URL}/api/otp/send`,
      JSON.stringify({ phone }),
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
      }
    );
    check(res, {
      "otp send 200 or 429": (r) => r.status === 200 || r.status === 429,
    });
    sleep(randomIntBetween(1, 3));
  });
}
