import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API staff counter contracts.
 * @module services/staff
 */

/**
 * Lists orders for staff order logs.
 *
 * @param {string} token - Staff access token.
 * @returns {Promise<{orders: object[]}>} Orders payload.
 */
export function getStaffOrders(token) {
  return apiRequest(api.endpoints.staffOrders, { token });
}

/**
 * Creates a manual staff order.
 *
 * @param {string} token - Staff access token.
 * @param {object} input - Order payload.
 * @returns {Promise<{order: object}>} Created order payload.
 */
export function createStaffOrder(token, input) {
  return apiRequest(api.endpoints.staffOrders, { method: "POST", token, body: input });
}

/**
 * Verifies a scanned order reference.
 *
 * @param {string} token - Staff access token.
 * @param {string} reference - QR payload or order number.
 * @returns {Promise<{order: object}>} Verified order payload.
 */
export function verifyOrder(token, reference) {
  return apiRequest(api.endpoints.staffVerifyOrder, {
    method: "POST",
    token,
    body: { reference }
  });
}

/**
 * Updates a counter order status.
 *
 * @param {string} token - Staff access token.
 * @param {string} id - Order id.
 * @param {string} status - New order status.
 * @returns {Promise<{order: object}>} Updated order payload.
 */
export function updateOrderStatus(token, id, status) {
  return apiRequest(`${api.endpoints.staffOrder}/${id}`, {
    method: "PATCH",
    token,
    body: { status }
  });
}
