import { api } from "../constants/config.js";
import { apiRequest } from "../network/transport.js";

/**
 * Lists all orders for administrators.
 *
 * @param {string} token - Admin access token.
 * @returns {Promise<{orders: object[]}>} Orders payload.
 */
export function getAdminOrders(token) {
  return apiRequest(api.endpoints.adminOrders, { token });
}

/**
 * Creates a order as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {object} input - Order payload.
 * @returns {Promise<{order: object}>} Created order payload.
 */
export function createAdminOrder(token, input) {
  return apiRequest(api.endpoints.adminOrders, { method: "POST", token, body: input });
}

/**
 * Updates a order as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {string} id - Order id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{order: object}>} Updated order payload.
 */
export function updateAdminOrder(token, id, input) {
  return apiRequest(`${api.endpoints.adminOrders}/${id}`, { method: "PATCH", token, body: input });
}

/**
 * Deletes a order as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {string} id - Order id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteAdminOrder(token, id) {
  return apiRequest(`${api.endpoints.adminOrders}/${id}`, { method: "DELETE", token });
}
