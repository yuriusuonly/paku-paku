import { jsonResponse } from "../network/response.js";
import { HTTP_STATUS } from "../network/status.js";

/**
 * Response shaping for menu item API routes.
 * @module responses/menu-items
 */

/**
 * Builds the menu items list response.
 *
 * @param {{items: object[]}} data - Menu payload.
 * @returns {Response} JSON response.
 */
export function menuItemsResponse(data) {
  return jsonResponse(data);
}

/**
 * Builds the menu item created response.
 *
 * @param {{item: object}} data - Created item payload.
 * @returns {Response} JSON response.
 */
export function menuItemCreatedResponse(data) {
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
}

/**
 * Builds the menu item response.
 *
 * @param {{item: object}} data - Item payload.
 * @returns {Response} JSON response.
 */
export function menuItemResponse(data) {
  return jsonResponse(data);
}

/**
 * Builds the menu item deleted response.
 *
 * @param {{id: string}} data - Deleted id payload.
 * @returns {Response} JSON response.
 */
export function menuItemDeletedResponse(data) {
  return jsonResponse(data);
}
