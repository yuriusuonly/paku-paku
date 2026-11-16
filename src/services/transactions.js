import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API transaction contracts.
 * @module services/transactions
 */

/** @param {string} token */
export function getMyTransactions(token) { return apiRequest(api.endpoints.transactions, { token }); }
/** @param {string} token @param {object} input */
export function createTransaction(token, input) { return apiRequest(api.endpoints.transactions, { method: "POST", token, body: input }); }
/** @param {string} token @param {string} id */
export function getTransaction(token, id) { return apiRequest(`${api.endpoints.transactions}/${id}`, { token }); }
/** @param {string} token @param {string} id @param {object} input */
export function updateTransaction(token, id, input) { return apiRequest(`${api.endpoints.transactions}/${id}`, { method: "PATCH", token, body: input }); }
/** @param {string} token */
export function getAdminTransactions(token) { return apiRequest(api.endpoints.adminTransactions, { token }); }
/** @param {string} token @param {object} input */
export function createAdminTransaction(token, input) { return apiRequest(api.endpoints.adminTransactions, { method: "POST", token, body: input }); }
/** @param {string} token @param {string} id @param {object} input */
export function updateAdminTransaction(token, id, input) { return apiRequest(`${api.endpoints.adminTransactions}/${id}`, { method: "PATCH", token, body: input }); }
/** @param {string} token @param {string} id */
export function deleteAdminTransaction(token, id) { return apiRequest(`${api.endpoints.adminTransactions}/${id}`, { method: "DELETE", token }); }
