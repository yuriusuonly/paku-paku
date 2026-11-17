import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API menu contracts.
 * @module services/menu
 */

/**
 * Loads available menu items for the public storefront.
 *
 * @returns {Promise<{items: object[]}>} Menu payload.
 */
export function getMenuItems() {
  return apiRequest(api.endpoints.menuItems);
}

/**
 * Creates a menu item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {object} input - Menu item fields.
 * @returns {Promise<{item: object}>} Created item payload.
 */
export function createMenuItem(token, input) {
  return apiRequest(api.endpoints.menuItems, {
    method: "POST",
    token,
    body: input
  });
}

/**
 * Updates a menu item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {string} id - Menu item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item payload.
 */
export function updateMenuItem(token, id, input) {
  return apiRequest(`${api.endpoints.menuItems}/${id}`, {
    method: "PATCH",
    token,
    body: input
  });
}

/**
 * Deletes a menu item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {string} id - Menu item id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteMenuItem(token, id) {
  return apiRequest(`${api.endpoints.menuItems}/${id}`, {
    method: "DELETE",
    token
  });
}
