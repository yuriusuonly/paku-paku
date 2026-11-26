import { expect, test } from "@playwright/test";
import { ORDER, signInAs } from "./fixtures.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Checkout confirmation contents, empty state and restart flow.
 * @module test/app/checkout.e2e
 */

test.beforeEach(async ({ page }) => {
  await signInAs(page, "guest");
  await page.addInitScript((order) => {
    window.localStorage.setItem("paku-paku.checkout", JSON.stringify(order));
  }, ORDER);
});

test("renders the placed order with its reference, total and items", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page.getByText("Checkout", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Show the QR code at the counter/)).toBeVisible();
  await expect(page.getByText("Order placed")).toBeVisible();
  await expect(page.getByText("CASH")).toBeVisible();
  await expect(page.getByText(/PP-1042/).first()).toBeVisible();
  await expect(page.getByText("₱180.00")).toBeVisible();
  await expect(page.getByText("• Ramen × 1")).toBeVisible();
  await expect(page.getByText("Show at the counter")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save QR image" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New order" })).toBeVisible();
});

test("shows the empty confirmation state when no order is stored", async ({ page }) => {
  await signInAs(page, "guest");
  await page.addInitScript(() => window.localStorage.removeItem("paku-paku.checkout"));
  await page.goto("/checkout");

  await expect(page.getByText(/No recent order found/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse the menu" })).toBeVisible();
});

test("starting a new order clears the confirmation and returns to the menu", async ({ page }) => {
  await page.goto("/checkout");
  await page.getByRole("button", { name: "New order" }).click();

  await expect(page).toHaveURL(/\/menu$/);
  expect(await page.evaluate(() => window.localStorage.getItem("paku-paku.checkout"))).toBeNull();
});
