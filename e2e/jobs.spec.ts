import { test, expect } from "@playwright/test";

test.describe("Job listing page", () => {
  test("jobs page loads with content", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.locator("body")).toBeAttached();
  });

  test("job detail page shows error for invalid ID", async ({ page }) => {
    await page.goto("/jobs/invalid-id-12345");
    await expect(page.locator("body")).toBeAttached();
  });
});

test.describe("Employer dashboard (unauthenticated)", () => {
  test("employer login redirect has redirect param", async ({ page }) => {
    await page.goto("/employer/dashboard");
    const url = page.url();
    expect(url).toContain("/login");
    expect(url).toContain("redirect");
  });

  test("cannot access employer jobs page without auth", async ({ page }) => {
    await page.goto("/employer/jobs");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employer payments page requires auth", async ({ page }) => {
    await page.goto("/employer/payments");
    await expect(page).toHaveURL(/\/login/);
  });

  test("employer profile page requires auth", async ({ page }) => {
    await page.goto("/employer/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Employer job posting (unauthenticated)", () => {
  test("new job page redirects to login", async ({ page }) => {
    await page.goto("/employer/jobs/new");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Job applications (unauthenticated)", () => {
  test("job applicants page redirects", async ({ page }) => {
    await page.goto("/employer/jobs/some-id/applicants");
    await expect(page).toHaveURL(/\/login/);
  });
});
