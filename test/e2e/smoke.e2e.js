import { expect, test } from "@playwright/test";

/**
 * Automated browser smoke tests.
 * @module test/e2e/smoke
 */

test.describe("web app smoke", () => {
  test("home page loads and shows primary navigation/content", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/paku/i).first()).toBeVisible();
  });

  test("signin page loads", async ({ page }) => {
    await page.goto("/signin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/signin\/?$/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i }).or(page.getByText(/sign in/i).first())).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/signup\/?$/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|create/i }).or(page.getByText(/sign up|create/i).first())).toBeVisible();
  });

  test("menu page route responds (redirect or content depending on session)", async ({ page }) => {
    const response = await page.goto("/menu", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response?.status() || 200).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("api smoke", () => {
  test("health endpoint returns ok payload", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/health`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");
  });
});
