import { badRequest } from "../errors/bad-request.js";
import { readJsonBody } from "../network/request.js";

/**
 * Request handling/validation for menu item API routes.
 * @module requests/menu-items
 */

/**
 * Validates the menu items list request (authentication is enforced by interceptors).
 *
 * @param {Request} request - Incoming request.
 * @returns {Request} The same request.
 */
export function validateMenuItemsRequest(request) {
  return request;
}

/**
 * Parses and validates a menu item create request.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{name: string, description: string | null, price_cents: number, is_available: boolean, sort_order: number}>} Validated payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When payload is invalid.
 */
export async function parseCreateMenuItemRequest(request) {
  const body = await readJsonBody(request);
  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with menu item fields.");
  }
  return normalizeMenuItemInput(body, { partial: false });
}

/**
 * Parses and validates a menu item update request.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<object>} Validated partial payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When payload is invalid.
 */
export async function parseUpdateMenuItemRequest(request) {
  const body = await readJsonBody(request);
  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with menu item fields.");
  }
  return normalizeMenuItemInput(body, { partial: true });
}

/**
 * @param {Record<string, unknown>} body - Request body.
 * @param {{partial: boolean}} options - Normalization options.
 * @returns {object} Normalized input.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When invalid.
 */
function normalizeMenuItemInput(body, { partial }) {
  const input = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw badRequest("invalid_menu_item", "Menu item name is required.");
    }
    input.name = name;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "description")) {
    if (body.description == null || body.description === "") {
      input.description = null;
    } else if (typeof body.description === "string") {
      input.description = body.description.trim();
    } else {
      throw badRequest("invalid_menu_item", "Menu item description must be a string.");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "price_cents")) {
    const price = Number(body.price_cents);
    if (!Number.isInteger(price) || price < 0) {
      throw badRequest("invalid_menu_item", "Menu item price_cents must be a non-negative integer.");
    }
    input.price_cents = price;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "is_available")) {
    if (typeof body.is_available !== "boolean") {
      throw badRequest("invalid_menu_item", "Menu item is_available must be a boolean.");
    }
    input.is_available = body.is_available;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "sort_order")) {
    const sortOrder = Number(body.sort_order);
    if (!Number.isInteger(sortOrder)) {
      throw badRequest("invalid_menu_item", "Menu item sort_order must be an integer.");
    }
    input.sort_order = sortOrder;
  }

  if (partial && Object.keys(input).length === 0) {
    throw badRequest("invalid_menu_item", "No menu item fields to update.");
  }

  return input;
}
