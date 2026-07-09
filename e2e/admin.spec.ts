import { test, expect } from "@playwright/test";

test.describe("Admin routes (unauthenticated)", () => {
  test("admin dashboard redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin users page redirects", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin jobs page redirects", async ({ page }) => {
    await page.goto("/admin/jobs");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin reports page redirects", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin payments page redirects", async ({ page }) => {
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin analytics page redirects", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin categories page redirects", async ({ page }) => {
    await page.goto("/admin/categories");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin cities page redirects", async ({ page }) => {
    await page.goto("/admin/cities");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Worker routes (unauthenticated)", () => {
  test("worker dashboard redirects", async ({ page }) => {
    await page.goto("/worker/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("worker applications redirects", async ({ page }) => {
    await page.goto("/worker/applications");
    await expect(page).toHaveURL(/\/login/);
  });

  test("worker profile redirects", async ({ page }) => {
    await page.goto("/worker/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});
