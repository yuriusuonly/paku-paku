import { api } from "../shared/config.js";
import { apiRequest } from "../network/http.js";

/**
 * Client-to-API menu contracts.
 * @module services/menu
 */

/**
 * Loads available menu items for a signed-in user.
 *
 * @param {string} token - Access token.
 * @returns {Promise<{items: object[]}>} Menu payload.
 */
export function getMenuItems(token) {
  return apiRequest(api.endpoints.menuItems, { token });
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
