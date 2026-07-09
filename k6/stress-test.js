import http from "k6/http";
import { check, sleep, group } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "1m", target: 200 },
    { duration: "2m", target: 500 },
    { duration: "1m", target: 1000 },
    { duration: "2m", target: 2000 },
    { duration: "2m", target: 3000 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000", "p(99)<8000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_AGENT = "k6-stress-test/1.0";

function homepage() {
  const res = http.get(`${BASE_URL}/`, {
    headers: { "User-Agent": USER_AGENT },
  });
  check(res, { "homepage status 200": (r) => r.status === 200 });
}

function loginPage() {
  const res = http.get(`${BASE_URL}/login`, {
    headers: { "User-Agent": USER_AGENT },
  });
  check(res, { "login page status 200": (r) => r.status === 200 });
}

function jobsPage() {
  const res = http.get(`${BASE_URL}/jobs`, {
    headers: { "User-Agent": USER_AGENT },
  });
  check(res, { "jobs page status 200": (r) => r.status === 200 });
}

function workersPage() {
  const res = http.get(`${BASE_URL}/workers`, {
    headers: { "User-Agent": USER_AGENT },
  });
  check(res, { "workers page status 200": (r) => r.status === 200 });
}

function apiHealth() {
  const res = http.get(`${BASE_URL}/api/health`, {
    headers: { "User-Agent": USER_AGENT },
  });
  check(res, { "health endpoint 200": (r) => r.status === 200 });
}

function otpSend() {
  const phone = `999999${String(randomIntBetween(1000, 9999))}`;
  const res = http.post(`${BASE_URL}/api/otp/send`, JSON.stringify({ phone }), {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  check(res, {
    "otp send 200 or 429": (r) => r.status === 200 || r.status === 429,
  });
}

export default function () {
  group("Page loads", () => {
    homepage();
    sleep(randomIntBetween(0.5, 2));
    loginPage();
    sleep(randomIntBetween(0.5, 2));
    jobsPage();
    sleep(randomIntBetween(0.5, 2));
    workersPage();
    sleep(randomIntBetween(0.5, 2));
  });

  group("API calls", () => {
    apiHealth();
    sleep(randomIntBetween(0.5, 1));
    otpSend();
    sleep(randomIntBetween(0.5, 1));
  });
}
