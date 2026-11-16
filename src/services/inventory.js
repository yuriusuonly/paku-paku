import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API inventory contracts.
 * @module services/inventory
 */

/**
 * Lists inventory items (admin).
 *
 * @param {string} token - Access token.
 * @returns {Promise<{items: object[]}>} Inventory payload.
 */
export function getInventoryItems(token) {
  return apiRequest(api.endpoints.adminInventory, { token });
}

/**
 * Creates an inventory item (admin).
 *
 * @param {string} token - Access token.
 * @param {object} input - Inventory fields.
 * @returns {Promise<{item: object}>} Created item payload.
 */
export function createInventoryItem(token, input) {
  return apiRequest(api.endpoints.adminInventory, { method: "POST", token, body: input });
}

/**
 * Updates an inventory item (admin).
 *
 * @param {string} token - Access token.
 * @param {string} id - Item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item payload.
 */
export function updateInventoryItem(token, id, input) {
  return apiRequest(`${api.endpoints.adminInventory}/${id}`, { method: "PATCH", token, body: input });
}

/**
 * Deletes an inventory item (admin).
 *
 * @param {string} token - Access token.
 * @param {string} id - Item id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteInventoryItem(token, id) {
  return apiRequest(`${api.endpoints.adminInventory}/${id}`, { method: "DELETE", token });
}
