import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "10s", target: 1500 },
    { duration: "1m", target: 1500 },
    { duration: "10s", target: 50 },
    { duration: "30s", target: 50 },
    { duration: "10s", target: 2000 },
    { duration: "1m", target: 2000 },
    { duration: "10s", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_AGENT = "k6-spike-test/1.0";

export default function () {
  group("Spike: Pages", () => {
    http.get(`${BASE_URL}/`, { headers: { "User-Agent": USER_AGENT } });
    sleep(randomIntBetween(0.1, 0.5));
    http.get(`${BASE_URL}/jobs`, { headers: { "User-Agent": USER_AGENT } });
    sleep(randomIntBetween(0.1, 0.5));
    http.get(`${BASE_URL}/login`, { headers: { "User-Agent": USER_AGENT } });
    sleep(randomIntBetween(0.1, 0.5));
  });

  group("Spike: API", () => {
    const phone = `888888${String(randomIntBetween(1000, 9999))}`;
    http.get(`${BASE_URL}/api/health`, {
      headers: { "User-Agent": USER_AGENT },
    });
    http.post(`${BASE_URL}/api/otp/send`, JSON.stringify({ phone }), {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    });
  });
}
