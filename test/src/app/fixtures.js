import config from "../../../src/constants/config.js";

/**
 * Shared API fixtures and request helpers for the reactive E2E specs.
 * @module test/app/fixtures
 */

/**
 * Session payloads for each role.
 *
 * @type {Record<string, {user: {id: string, email: string, role: string}, session: {access_token: string, token_type: string}}>}
 */
export const SESSIONS = {
  guest: {
    user: { id: "e2e-guest", email: "guest@paku-paku.official", role: "customer" },
    session: { access_token: "e2e-guest-token", token_type: "bearer" }
  },
  staff: {
    user: { id: "e2e-staff", email: "staff@paku-paku.official", role: "staff" },
    session: { access_token: "e2e-staff-token", token_type: "bearer" }
  },
  admin: {
    user: { id: "e2e-admin", email: "admin@paku-paku.official", role: "admin" },
    session: { access_token: "e2e-admin-token", token_type: "bearer" }
  }
};

/**
 * Menu fixture with a main dish, a drink and an unavailable item.
 *
 * @type {object[]}
 */
export const ITEMS = [
  {
    id: "i1",
    name: "Ramen",
    description: "Rich broth with noodles",
    price_cents: 18000,
    is_available: true,
    is_best_seller: true,
    sort_order: 210
  },
  {
    id: "i2",
    name: "Iced tea",
    description: "Cold brewed tea",
    price_cents: 4000,
    is_available: true,
    is_best_seller: false,
    sort_order: 10
  },
  {
    id: "i3",
    name: "Hidden dish",
    description: "Not on the menu",
    price_cents: 9000,
    is_available: false,
    is_best_seller: false,
    sort_order: 220
  }
];

/**
 * Placed order fixture used by checkout and staff lookup flows.
 *
 * @type {object}
 */
export const ORDER = {
  id: "o1",
  order_number: "PP-1042",
  reference: "PP-1042",
  status: "Pending",
  payment_method: "cash",
  total_cents: 18000,
  discount_cents: 0,
  qr_payload: "PP-1042",
  customer_name: "Walk-in",
  notes: "",
  created_at: "2026-01-01T10:00:00.000Z",
  items: [{ item_name: "Ramen", quantity: 1, line_total_cents: 18000 }]
};

/**
 * Profile fixtures for the admin audit table.
 *
 * @type {object[]}
 */
export const PROFILES = [
  {
    id: "u1",
    email: "admin@paku-paku.official",
    role: "admin",
    is_active: true,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z"
  },
  {
    id: "u2",
    email: "guest@paku-paku.official",
    role: "customer",
    is_active: true,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z"
  }
];

/**
 * Audit log fixtures for the admin audit table.
 *
 * @type {object[]}
 */
export const LOGS = [
  {
    id: "l1",
    action: "INSERT",
    table_name: "items",
    summary: "Ramen",
    after_data: { name: "Ramen" },
    actor_email: "kiosk",
    record_id: "i1",
    created_at: "2026-01-01T10:00:00.000Z"
  }
];

/**
 * Responds to an API path with a JSON body, optionally after a delay.
 *
 * @param {import("@playwright/test").Page} page - Playwright page.
 * @param {string} path - API path such as `/api/items`.
 * @param {unknown} body - JSON response body.
 * @param {{status?: number, delay?: number}} [options] - Response options.
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function routeJson(page, path, body, { status = 200, delay = 0 } = {}) {
  await page.route(`**${path}*`, async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body)
    });
  });
}

/**
 * Seeds a persisted session and mocks session validation for a role.
 *
 * @param {import("@playwright/test").Page} page - Playwright page.
 * @param {"guest" | "staff" | "admin"} role - Role to authenticate as.
 * @returns {Promise<void>} Resolves once the session is prepared.
 */
export async function signInAs(page, role) {
  const payload = SESSIONS[role];
  await page.addInitScript((session) => {
    window.localStorage.setItem("paku-paku.session", JSON.stringify(session));
  }, payload.session);
  await routeJson(page, config.api.endpoints.session, { user: payload.user });
}

/**
 * Mocks the public items endpoint.
 *
 * @param {import("@playwright/test").Page} page - Playwright page.
 * @param {object[]} [items] - Items payload.
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function mockItems(page, items = ITEMS) {
  await routeJson(page, config.api.endpoints.items, { items });
}
