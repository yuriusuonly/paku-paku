import { expect, test } from "@playwright/test";
import config from "../../../src/constants/config.js";
import { ORDER, mockItems, routeJson, signInAs } from "./fixtures.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Staff order taking, order lookup and order logs flows.
 * @module test/app/staff.e2e
 */

const VERIFY = `**${config.api.endpoints.staffVerifyOrder}`;
const STAFF_ORDERS = `**${config.api.endpoints.staffOrders}`;

test.beforeEach(async ({ page }) => {
  await signInAs(page, "staff");
  await mockItems(page);
});

test("order taking renders the form contents and payment controls", async ({ page }) => {
  await page.goto("/staff/order");

  await expect(page.getByText("Order taking", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /View order logs/ })).toBeVisible();
  await expect(page.getByText("Take an order")).toBeVisible();
  await expect(page.getByText("Order reference (optional)")).toBeVisible();
  await expect(page.getByPlaceholder("ORD-XXXXXXXXXX or pasted QR payload")).toBeVisible();
  await expect(page.getByRole("button", { name: "Fill from order" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Scan with camera" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload QR image" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Order status" })).toHaveText("Paid");
  await expect(page.getByRole("button", { name: "Payment method" })).toHaveText("cash");
  await expect(page.getByPlaceholder("Optional (walk-in)")).toBeVisible();
  await expect(page.getByText("Subtotal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create order" })).toBeVisible();
});

test("validates an empty order before calling the API", async ({ page }) => {
  let requests = 0;
  await page.route(STAFF_ORDERS, (route) => {
    requests += 1;
    return route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
  });

  await page.goto("/staff/order");
  await page.getByRole("button", { name: "Create order" }).click();

  await expect(page.getByText("Order: select at least one item.").first()).toBeVisible();
  expect(requests).toBe(0);
});

test("creates an order and reports success", async ({ page }) => {
  let payload = null;
  await page.route(STAFF_ORDERS, async (route) => {
    payload = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ order: { ...ORDER, order_number: "ORD-1234567890" } })
    });
  });

  await page.goto("/staff/order");
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByRole("button", { name: "Item 1" }).click();
  await page.getByRole("button", { name: "Ramen", exact: true }).click();
  await page.getByRole("button", { name: "Create order" }).click();

  await expect(page.getByText("Order ORD-1234567890 created.")).toBeVisible();
  expect(payload.items[0].item_name).toBe("Ramen");
  expect(payload.status).toBe("Paid");
});

test("looks up an order from its reference and fills the form", async ({ page }) => {
  let reference = null;
  await page.route(VERIFY, async (route) => {
    const sent = JSON.parse(route.request().postData() || "{}").reference;
    if (!reference) reference = sent;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ order: ORDER }) });
  });

  await page.goto("/staff/order");
  await page.getByPlaceholder("ORD-XXXXXXXXXX or pasted QR payload").fill("ORD-1234567890");
  await page.getByRole("button", { name: "Fill from order" }).click();

  await expect(page.getByText("PP-1042 loaded", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Optional (walk-in)")).toHaveValue("Walk-in");
  expect(reference).toBe("ORD-1234567890");
});

test("shows a lookup failure and a create failure snackbar", async ({ page }) => {
  await routeJson(page, config.api.endpoints.staffVerifyOrder, {
    error: { code: "not_found", message: "Could not find that order." }
  }, { status: 404 });
  await routeJson(page, config.api.endpoints.staffOrders, {
    error: { code: "bad_request", message: "Could not create the order." }
  }, { status: 400 });

  await page.goto("/staff/order");
  await page.getByPlaceholder("ORD-XXXXXXXXXX or pasted QR payload").fill("ORD-1234567890");
  await page.getByRole("button", { name: "Fill from order" }).click();
  await expect(page.getByText("Could not find that order.").first()).toBeVisible();

  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByRole("button", { name: "Item 1" }).click();
  await page.getByRole("button", { name: "Ramen", exact: true }).click();
  await page.getByRole("button", { name: "Create order" }).click();
  await expect(page.getByText("Could not create the order.").first()).toBeVisible();
});

test("order logs render rows and update a status through the API", async ({ page }) => {
  let update = null;
  await routeJson(page, config.api.endpoints.staffOrders, {
    orders: [{ ...ORDER, status: "Pending" }]
  });
  await page.route(`**${config.api.endpoints.staffOrder}/o1`, async (route) => {
    update = JSON.parse(route.request().postData() || "{}");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ order: { ...ORDER, status: "Paid" } })
    });
  });

  await page.goto("/staff/records");
  await expect(page.getByText("Order logs", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("PP-1042")).toBeVisible();
  await expect(page.getByText("₱180.00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Order status for PP-1042" }).click();
  await page.getByRole("button", { name: "Paid", exact: true }).click();

  await expect(page.getByText("Order PP-1042 marked paid.")).toBeVisible();
  expect(update.status).toBe("Paid");
});

test("unauthenticated visitors cannot enter staff routes", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("paku-paku.session"));
  await page.goto("/staff/order");
  await expect(page).toHaveURL(/\/signin$/);
});
