import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Lists all transactions for administrators.
 *
 * @param {string} token - Admin access token.
 * @returns {Promise<{transactions: object[]}>} Transactions payload.
 */
export function getAdminTransactions(token) {
  return apiRequest(api.endpoints.adminTransactions, { token });
}

/**
 * Creates a transaction as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {object} input - Transaction payload.
 * @returns {Promise<{transaction: object}>} Created transaction payload.
 */
export function createAdminTransaction(token, input) {
  return apiRequest(api.endpoints.adminTransactions, { method: "POST", token, body: input });
}

/**
 * Updates a transaction as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {string} id - Transaction id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{transaction: object}>} Updated transaction payload.
 */
export function updateAdminTransaction(token, id, input) {
  return apiRequest(`${api.endpoints.adminTransactions}/${id}`, { method: "PATCH", token, body: input });
}

/**
 * Deletes a transaction as an administrator.
 *
 * @param {string} token - Admin access token.
 * @param {string} id - Transaction id.
 * @returns {Promise<{id: string}>} Deleted id payload.
 */
export function deleteAdminTransaction(token, id) {
  return apiRequest(`${api.endpoints.adminTransactions}/${id}`, { method: "DELETE", token });
}
