import { api } from "../constants/config.js";
import { apiRequest } from "../network/transport.js";

/**
 * Client-to-API item contracts.
 * @module services/items
 */

/**
 * Loads available items for the public storefront.
 *
 * @returns {Promise<{items: object[]}>} Items payload.
 */
export function getItems() {
  return apiRequest(api.endpoints.items);
}

/**
 * Creates an item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {object} input - Item fields.
 * @returns {Promise<{item: object}>} Created item payload.
 */
export function createItem(token, input) {
  return apiRequest(api.endpoints.items, {
    method: "POST",
    token,
    body: input
  });
}

/**
 * Updates an item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {string} id - Item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item payload.
 */
export function updateItem(token, id, input) {
  return apiRequest(`${api.endpoints.items}/${id}`, {
    method: "PATCH",
    token,
    body: input
  });
}

/**
 * Deletes an item (admin-only).
 *
 * @param {string} token - Access token.
 * @param {string} id - Item id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteItem(token, id) {
  return apiRequest(`${api.endpoints.items}/${id}`, {
    method: "DELETE",
    token
  });
}
