import { expect, test } from "@playwright/test";
import config from "../../constants/config.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Mocked guest session and menu data for the customer flow.
 *
 * @type {object}
 */
const GUEST = {
  user: {
    id: "e2e-guest",
    email: "guest@paku-paku.official",
    role: "customer"
  },
  session: {
    access_token: "e2e-token",
    token_type: "bearer"
  }
};

/**
 * E2E flows for the customer menu route.
 * @module test/app/menu.e2e
 */

test.beforeEach(async ({ page }) => {
  await page.route(`**${config.api.endpoints.signin}`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(GUEST)
  }));
  await page.route(`**${config.api.endpoints.session}`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ user: GUEST.user })
  }));
  await page.route(`**${config.api.endpoints.items}`, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      items: [{
        id: "i1",
        name: "Ramen",
        description: "Rich broth with noodles",
        price_cents: 18000,
        is_available: true,
        is_best_seller: false,
        sort_order: 0
      }]
    })
  }));
  await page.route(`**${config.api.endpoints.checkout}`, (route) => route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({
      order: {
        id: "o1",
        reference: "PP-1042",
        status: "Pending",
        total_cents: 18000
      }
    })
  }));
});

test("a guest can add an item, review the cart and place an order", async ({ page }) => {
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  await expect(page.getByText("Menu", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /Add one Ramen to cart/ }).click();
  await expect(page.getByRole("link", { name: /Cart \(1\)/ })).toBeVisible();

  await page.getByRole("link", { name: /Cart/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Checkout", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Show the QR code at the counter/)).toBeVisible();
});

test("the menu is responsive and keeps 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/signin");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/\/menu$/);

  const addButton = page.getByRole("button", { name: /Add one Ramen to cart/ });
  const box = await addButton.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 820, height: 1100 });
  await expect(page.getByText("Menu", { exact: true }).first()).toBeVisible();
});
