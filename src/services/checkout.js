import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API kiosk checkout contract.
 * @module services/checkout
 */

/**
 * Places a customer kiosk order and returns its counter QR order.
 *
 * @param {{payment_method?: string, items: object[]}} input - Checkout payload.
 * @param {string} token - Shared guest access token.
 * @returns {Promise<{order: object}>} Created order payload.
 */
export function placeOrder(input, token) {
  return apiRequest(api.endpoints.checkout, { method: "POST", token, body: input });
}
