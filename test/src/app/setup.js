import { test } from "@playwright/test";
import config from "../../../src/constants/config.js";
import { routeJson } from "./fixtures.js";

/**
 * Default API mocks applied to every E2E test before its own fixtures.
 * Keeps the suite hermetic: no production data and no local Supabase stack is
 * required in CI. Individual specs override these routes as needed.
 * @module test/app/setup
 */

test.beforeEach(async ({ page }) => {
  await routeJson(page, config.api.endpoints.session, {
    error: { code: "unauthorized", message: "Invalid or expired session." }
  }, { status: 401 });
  await routeJson(page, config.api.endpoints.signin, {
    error: { code: "invalid_credentials", message: "Invalid email or password." }
  }, { status: 401 });
  await routeJson(page, config.api.endpoints.items, { items: [] });
  await routeJson(page, config.api.endpoints.checkout, { order: null }, { status: 201 });
  await routeJson(page, config.api.endpoints.adminProfiles, { profiles: [] });
  await routeJson(page, config.api.endpoints.adminAuditLogs, { logs: [] });
  await routeJson(page, config.api.endpoints.adminOrders, { orders: [] });
  await routeJson(page, config.api.endpoints.staffOrders, { orders: [] });
  await routeJson(page, config.api.endpoints.staffVerifyOrder, {
    error: { code: "not_found", message: "Order not found." }
  }, { status: 404 });
  await routeJson(page, `${config.api.endpoints.staffOrder}/*`, { order: null });
  await page.route(`**${config.api.endpoints.signout}*`, (route) =>
    route.fulfill({ status: 204, body: "" }));
});
