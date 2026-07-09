import { test, expect } from "@playwright/test";

test.describe("API health", () => {
  test("health endpoint returns success", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
    expect(body.checks).toBeDefined();
  });

  test("ready endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/ready");
    expect(res.status()).toBe(200);
  });

  test("live endpoint returns alive", async ({ request }) => {
    const res = await request.get("/api/live");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("alive");
  });
});

test.describe("API OTP", () => {
  test("OTP send with invalid phone returns 400", async ({ request }) => {
    const res = await request.post("/api/otp/send", {
      data: { phone: "123" },
    });
    expect(res.status()).toBe(400);
  });

  test("OTP send with valid phone returns success or rate limited", async ({ request }) => {
    const res = await request.post("/api/otp/send", {
      data: { phone: "9876543210" },
    });
    // Either success or rate-limited (429) is acceptable
    expect([200, 429]).toContain(res.status());
  });

  test("OTP send without phone returns 400", async ({ request }) => {
    const res = await request.post("/api/otp/send", {
      data: {},
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("API logout", () => {
  test("logout POST requires no auth", async ({ request }) => {
    const res = await request.post("/api/logout");
    // Should either succeed or be rate limited
    expect([200, 302, 429]).toContain(res.status());
  });

  test("logout GET returns 405", async ({ request }) => {
    const res = await request.get("/api/logout");
    expect(res.status()).toBe(405);
  });
});

test.describe("API 404", () => {
  test("unknown API returns 404 or redirect", async ({ request }) => {
    const res = await request.get("/api/unknown-route");
    // Middleware redirects unauthenticated users to login
    expect([200, 302, 307, 404]).toContain(res.status());
  });
});

test.describe("API CSRF", () => {
  test("invalid method on logout returns 405", async ({ request }) => {
    const res = await request.put("/api/logout");
    expect(res.status()).toBe(405);
  });
});
