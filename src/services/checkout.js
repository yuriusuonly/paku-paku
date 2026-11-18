import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API kiosk checkout contract.
 * @module services/checkout
 */

/**
 * Places a public kiosk order and returns its counter QR order.
 *
 * @param {{payment_method?: string, items: object[]}} input - Checkout payload.
 * @returns {Promise<{order: object}>} Created order payload.
 */
export function placeOrder(input) {
  return apiRequest(api.endpoints.checkout, { method: "POST", body: input });
}
