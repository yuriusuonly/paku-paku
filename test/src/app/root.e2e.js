import { expect, test } from "@playwright/test";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * E2E coverage for the public landing page and the not-found route.
 * @module test/app/root.e2e
 */

test("the landing page renders its content and public navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Under active development")).toBeVisible();
  await expect(page.getByText("Paku-Paku", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/A web-only kiosk storefront/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start ordering" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Paku-Paku logo")).toBeVisible();
});

test("the landing page keeps its content readable on a wearable viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Start ordering" })).toBeVisible();
  await expect(page.getByText(/A web-only kiosk storefront/)).toBeVisible();
});

test("an unknown route renders the 404 state with a way home", async ({ page }) => {
  const response = await page.goto("/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByText("404", { exact: true })).toBeVisible();
  await expect(page.getByText("This page does not exist.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Back home/ })).toBeVisible();
});
