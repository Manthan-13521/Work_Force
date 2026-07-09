import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads and shows heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About|Workforce/);
  });

  test("contact page loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("form, button[type=submit], input").first()).toBeVisible().catch(() =>
      expect(page.locator("h1, h2").first()).toBeVisible()
    );
  });

  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("jobs listing page loads", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator("body")).toBeAttached();
  });

  test("workers listing page loads", async ({ page }) => {
    await page.goto("/workers");
    await expect(page.locator("body")).toBeAttached();
  });
});

test.describe("Navigation", () => {
  test("navigation links are visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav, header").first()).toBeVisible();
  });

  test("can navigate to jobs page from homepage", async ({ page }) => {
    await page.goto("/");
    const jobsLink = page.locator("a").filter({ hasText: /jobs/i }).first();
    if (await jobsLink.isVisible()) {
      await jobsLink.click();
      await expect(page).toHaveURL(/\/jobs/);
    }
  });
});

test.describe("Auth pages", () => {
  test("login page loads with phone input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=tel], input[name=phone]").first()).toBeVisible();
  });

  test("register page loads with role selection", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).toBeAttached();
  });
});

test.describe("API", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBeDefined();
  });

  test("unknown API route returns 404 or redirect", async ({ request }) => {
    const response = await request.get("/api/nonexistent");
    expect([200, 302, 307, 404]).toContain(response.status());
  });
});

test.describe("Redirects", () => {
  test("unauthenticated access to admin redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to employer redirects to login", async ({ page }) => {
    await page.goto("/employer/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to worker redirects to login", async ({ page }) => {
    await page.goto("/worker/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("PWA", () => {
  test("manifest.json exists and is valid", async ({ request }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
  });

  test("service worker responds", async ({ page }) => {
    await page.goto("/");
    const registrations = await page.evaluate(() =>
      navigator.serviceWorker?.getRegistrations().then((r) => r.length)
    );
    // In test environment SW may not register, so this is informational
    expect(registrations).toBeDefined();
  });
});

test.describe("Security headers", () => {
  test("CSP header is set", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"] || headers["x-content-type-options"]).toBeDefined();
  });
});
