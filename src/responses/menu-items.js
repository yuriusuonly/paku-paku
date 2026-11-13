import { jsonResponse } from "../shared/response.js";

/**
 * Response shaping for `GET /api/menu-items`.
 * @module responses/menu-items
 */

/**
 * Builds the menu items response.
 *
 * @param {{items: object[]}} data - Menu payload.
 * @returns {Response} JSON response.
 */
export function menuItemsResponse(data) {
  return jsonResponse(data);
}
