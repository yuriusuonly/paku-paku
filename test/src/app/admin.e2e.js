import { expect, test } from "@playwright/test";
import config from "../../../src/constants/config.js";
import { LOGS, ORDER, PROFILES, mockItems, routeJson, signInAs } from "./fixtures.js";

// The Expo dev server bundles routes on first navigation.
test.setTimeout(120000);

/**
 * Admin dashboard, items, orders, profiles and audit-log flows.
 * @module test/app/admin.e2e
 */

test.beforeEach(async ({ page }) => {
  await signInAs(page, "admin");
  await mockItems(page);
  await routeJson(page, config.api.endpoints.adminProfiles, { profiles: PROFILES });
  await routeJson(page, config.api.endpoints.adminAuditLogs, { logs: LOGS });
  await routeJson(page, config.api.endpoints.adminOrders, { orders: [ORDER] });
});

test("the dashboard renders live counts and audit navigation", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByText("Administration dashboard")).toBeVisible();
  await expect(page.getByText(/Live operational overview/)).toBeVisible();
  await expect(page.getByText("Items", { exact: true })).toBeVisible();
  await expect(page.getByText("Total items")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open items audit/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open profiles audit/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open audit logs/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open orders/ })).toBeVisible();
});

test("items management renders the table and validates a new item", async ({ page }) => {
  await page.goto("/admin/items");

  await expect(page.getByText("Items management")).toBeVisible();
  const values = await page.getByRole("textbox").evaluateAll((elements) =>
    elements.map((element) => element.value));
  expect(values).toContain("Iced tea");
  expect(values).toContain("Ramen");
  expect(values).toContain("Hidden dish");
  await expect(page.getByText("3 total")).toBeVisible();

  await page.getByRole("button", { name: /New item/ }).click();
  await page.getByRole("button", { name: "Create item" }).click();
  await expect(page.getByText("Item name is required.")).toBeVisible();
});

test("items management creates an item through the API and shows success", async ({ page }) => {
  let payload = null;
  await page.route(`**${config.api.endpoints.items}`, async (route) => {
    if (route.request().method() === "POST") {
      payload = JSON.parse(route.request().postData() || "{}");
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ item: { id: "i4", ...payload } })
      });
      return;
    }
    return route.continue();
  });

  await page.goto("/admin/items");
  await page.getByRole("button", { name: /New item/ }).click();
  await page.getByPlaceholder("Chicken Teriyaki").fill("Miso soup");
  await page.getByPlaceholder("Description").fill("Warm soup");
  await page.getByPlaceholder("0").fill("1200");
  await page.getByRole("button", { name: "Create item" }).click();

  await expect(page.getByText("Item created.")).toBeVisible();
  expect(payload.name).toBe("Miso soup");
  expect(payload.price_cents).toBe(1200);
});

test("items management surfaces an API failure", async ({ page }) => {
  await routeJson(page, config.api.endpoints.items, {
    error: { code: "bad_request", message: "Could not save the item." }
  }, { status: 400 });

  await page.goto("/admin/items");
  await page.getByRole("button", { name: /New item/ }).click();
  await page.getByPlaceholder("Chicken Teriyaki").fill("Miso soup");
  await page.getByPlaceholder("0").fill("1200");
  await page.getByRole("button", { name: "Create item" }).click();

  await expect(page.getByText("Could not save the item.").first()).toBeVisible();
});

test("orders render their contents and a failed load shows an alert", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page.getByText("Orders", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("o1", { exact: true })).toBeVisible();
  await expect(page.getByText("₱180.00", { exact: true })).toBeVisible();

  await routeJson(page, config.api.endpoints.adminOrders, {
    error: { code: "unauthorized", message: "Session expired." }
  }, { status: 401 });
  await page.goto("/admin");
  await page.goto("/admin/orders");
  await expect(page.getByText(/Session expired/)).toBeVisible();
});

test("profiles render and toggling active state calls the API", async ({ page }) => {
  let updated = false;
  await page.route(`**${config.api.endpoints.adminProfiles}`, async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ profiles: PROFILES })
      });
      return;
    }
    updated = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ profile: { ...PROFILES[1], is_active: false } })
    });
  });

  await page.goto("/admin/profiles");
  await expect(page.getByText("Profiles audit")).toBeVisible();
  await expect(page.getByText("admin@paku-paku.official")).toBeVisible();
  await expect(page.getByText("guest@paku-paku.official")).toBeVisible();

  await page.getByRole("button", { name: "active", exact: true }).first().click();
  await expect(page.getByText("Profile deactivated.")).toBeVisible();
  expect(updated).toBe(true);
});

test("audit logs render events, action badges and an error state", async ({ page }) => {
  await page.goto("/admin/audit-logs");

  await expect(page.getByText("Audit logs", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Activity")).toBeVisible();
  await expect(page.getByText("INSERT")).toBeVisible();
  await expect(page.getByText("items", { exact: true })).toBeVisible();
  await expect(page.getByText("Ramen", { exact: true })).toBeVisible();

  await routeJson(page, config.api.endpoints.adminAuditLogs, {
    error: { code: "forbidden", message: "Audit access denied." }
  }, { status: 403 });
  await page.goto("/admin/audit-logs");
  await expect(page.getByText(/Audit access denied/)).toBeVisible();
});

test("customers cannot enter the admin area", async ({ page }) => {
  await signInAs(page, "guest");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/signin$/);
});
