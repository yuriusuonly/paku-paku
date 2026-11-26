import { expect, test } from "@playwright/test";
import config from "../../../src/constants/config.js";
import { ORDER, routeJson, signInAs } from "./fixtures.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Cart contents, dynamic states and checkout API flow.
 * @module test/app/cart.e2e
 */

/**
 * Two cart lines with a meal pair so the discount rule is exercised.
 *
 * @type {object[]}
 */
const CART = [
  { item_id: "i1", item_name: "Ramen", unit_price_cents: 18000, quantity: 1, category: "food" },
  { item_id: "i2", item_name: "Iced tea", unit_price_cents: 4000, quantity: 1, category: "beverage" }
];

/**
 * Seeds a guest session and cart before navigation.
 *
 * @param {import("@playwright/test").Page} page - Playwright page.
 * @param {object[]} [items] - Cart lines.
 * @returns {Promise<void>} Resolves once storage is seeded.
 */
async function seed(page, items = CART) {
  await signInAs(page, "guest");
  await page.addInitScript((cart) => {
    window.localStorage.setItem("paku-paku.cart", JSON.stringify(cart));
  }, items);
}

test.beforeEach(async ({ page }) => {
  await seed(page);
});

test("renders cart contents, payment methods and discounted totals", async ({ page }) => {
  await page.goto("/cart");

  await expect(page.getByText("Cart", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Ramen")).toBeVisible();
  await expect(page.getByText("₱180.00 × 1 = ₱180.00")).toBeVisible();
  await expect(page.getByText("Iced tea")).toBeVisible();
  await expect(page.getByText("Subtotal: ₱220.00")).toBeVisible();
  await expect(page.getByText("Discount: -₱10.00")).toBeVisible();
  await expect(page.getByText("Total: ₱210.00")).toBeVisible();
  await expect(page.getByRole("button", { name: "CASH" })).toHaveClass(/bg-\[#FE2C55\]/);
  await expect(page.getByRole("button", { name: "CARD" })).toBeVisible();
  await expect(page.getByText(/Meal discount applied/)).toBeVisible();
});

test("quantity controls and clear update the cart", async ({ page }) => {
  await page.goto("/cart");

  await page.getByRole("button", { name: "+" }).first().click();
  await expect(page.getByText("Subtotal: ₱400.00")).toBeVisible();
  await page.getByRole("button", { name: "Remove" }).nth(1).click();
  await expect(page.getByText("Total: ₱360.00").first()).toBeVisible();

  await page.getByRole("button", { name: "Clear cart" }).click();
  await expect(page.getByText("Your cart is empty. Add items from the menu to place an order.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse menu/ })).toBeVisible();
});

test("shows an empty cart when no lines are stored", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("paku-paku.cart", "[]"));
  await page.goto("/cart");

  await expect(page.getByText("Your cart is empty. Add items from the menu to place an order.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Browse menu/ })).toBeVisible();
});

test("keeps place order busy and navigates to checkout on success", async ({ page }) => {
  let payload = null;
  await page.route(`**${config.api.endpoints.checkout}`, async (route) => {
    payload = JSON.parse(route.request().postData() || "{}");
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ order: ORDER })
    });
  });

  await page.goto("/cart");
  await page.getByRole("button", { name: "CARD" }).click();
  const place = page.getByRole("button", { name: "Place order" });
  await place.click();

  await expect(place).toBeDisabled();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(payload.payment_method).toBe("card");
  expect(payload.items).toHaveLength(2);
  await expect(page.getByText("Order placed")).toBeVisible();
});

test("surfaces checkout API errors and stays on the cart", async ({ page }) => {
  await routeJson(page, config.api.endpoints.checkout, {
    error: { code: "bad_request", message: "Could not place the order." }
  }, { status: 400 });

  await page.goto("/cart");
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page.getByText("Could not place the order.").first()).toBeVisible();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("button", { name: "Place order" })).toBeEnabled();
});
