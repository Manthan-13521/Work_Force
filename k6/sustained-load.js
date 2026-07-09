import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "5m", target: 50 },
    { duration: "10m", target: 200 },
    { duration: "5m", target: 500 },
    { duration: "10m", target: 500 },
    { duration: "5m", target: 200 },
    { duration: "5m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_AGENT = "k6-sustained-load/1.0";

export default function () {
  group("Homepage", () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { "homepage 200": (r) => r.status === 200 });
    sleep(randomIntBetween(1, 3));
  });

  group("Jobs", () => {
    const res = http.get(`${BASE_URL}/jobs`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { "jobs 200": (r) => r.status === 200 });
    sleep(randomIntBetween(1, 3));
  });

  group("Workers", () => {
    const res = http.get(`${BASE_URL}/workers`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { "workers 200": (r) => r.status === 200 });
    sleep(randomIntBetween(1, 3));
  });

  group("API Health", () => {
    const res = http.get(`${BASE_URL}/api/health`, {
      headers: { "User-Agent": USER_AGENT },
    });
    check(res, { "health 200": (r) => r.status === 200 });
    sleep(1);
  });
}
