import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API order contracts.
 * @module services/orders
 */

/** @param {string} token */
export function getMyOrders(token) { return apiRequest(api.endpoints.orders, { token }); }
/** @param {string} token @param {object} input */
export function createOrder(token, input) { return apiRequest(api.endpoints.orders, { method: "POST", token, body: input }); }
/** @param {string} token @param {string} id */
export function getOrder(token, id) { return apiRequest(`${api.endpoints.orders}/${id}`, { token }); }
/** @param {string} token @param {string} id @param {object} input */
export function updateOrder(token, id, input) { return apiRequest(`${api.endpoints.orders}/${id}`, { method: "PATCH", token, body: input }); }
/** @param {string} token */
export function getAdminOrders(token) { return apiRequest(api.endpoints.adminOrders, { token }); }
/** @param {string} token @param {string} id @param {object} input */
export function updateAdminOrder(token, id, input) { return apiRequest(`${api.endpoints.adminOrders}/${id}`, { method: "PATCH", token, body: input }); }
/** @param {string} token @param {string} id */
export function deleteAdminOrder(token, id) { return apiRequest(`${api.endpoints.adminOrders}/${id}`, { method: "DELETE", token }); }
