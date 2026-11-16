import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API transaction contracts.
 * @module services/transactions
 */

/**
 * Lists the signed-in customer's transactions.
 *
 * @param {string} token - Access token.
 * @returns {Promise<{transactions: object[]}>} Transactions payload.
 */
export function getMyTransactions(token) {
  return apiRequest(api.endpoints.transactions, { token });
}

/**
 * Places a buy transaction from the customer cart.
 *
 * @param {string} token - Access token.
 * @param {object} input - Transaction payload.
 * @returns {Promise<{transaction: object}>} Created transaction payload.
 */
export function createTransaction(token, input) {
  return apiRequest(api.endpoints.transactions, { method: "POST", token, body: input });
}

/**
 * Gets a customer transaction by id.
 *
 * @param {string} token - Access token.
 * @param {string} id - Transaction id.
 * @returns {Promise<{transaction: object}>} Transaction payload.
 */
export function getTransaction(token, id) {
  return apiRequest(`${api.endpoints.transactions}/${id}`, { token });
}

/**
 * Updates a customer transaction.
 *
 * @param {string} token - Access token.
 * @param {string} id - Transaction id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{transaction: object}>} Updated transaction payload.
 */
export function updateTransaction(token, id, input) {
  return apiRequest(`${api.endpoints.transactions}/${id}`, { method: "PATCH", token, body: input });
}

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
