import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API sales contracts.
 * @module services/sales
 */

/**
 * Lists sales (admin).
 *
 * @param {string} token - Access token.
 * @returns {Promise<{sales: object[]}>} Sales payload.
 */
export function getSales(token) {
  return apiRequest(api.endpoints.adminSales, { token });
}

/**
 * Creates a sale (admin).
 *
 * @param {string} token - Access token.
 * @param {object} input - Sale fields including items.
 * @returns {Promise<{sale: object}>} Created sale payload.
 */
export function createSale(token, input) {
  return apiRequest(api.endpoints.adminSales, { method: "POST", token, body: input });
}

/**
 * Gets a sale by id (admin).
 *
 * @param {string} token - Access token.
 * @param {string} id - Sale id.
 * @returns {Promise<{sale: object}>} Sale payload.
 */
export function getSale(token, id) {
  return apiRequest(`${api.endpoints.adminSales}/${id}`, { token });
}

/**
 * Updates a sale (admin).
 *
 * @param {string} token - Access token.
 * @param {string} id - Sale id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{sale: object}>} Updated sale payload.
 */
export function updateSale(token, id, input) {
  return apiRequest(`${api.endpoints.adminSales}/${id}`, { method: "PATCH", token, body: input });
}

/**
 * Deletes a sale (admin).
 *
 * @param {string} token - Access token.
 * @param {string} id - Sale id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteSale(token, id) {
  return apiRequest(`${api.endpoints.adminSales}/${id}`, { method: "DELETE", token });
}
