import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API invoice contracts.
 * @module services/invoices
 */

/** @param {string} token */
export function getMyInvoices(token) { return apiRequest(api.endpoints.invoices, { token }); }
/** @param {string} token @param {string} id */
export function getInvoice(token, id) { return apiRequest(`${api.endpoints.invoices}/${id}`, { token }); }
/** @param {string} token */
export function getAdminInvoices(token) { return apiRequest(api.endpoints.adminInvoices, { token }); }
/** @param {string} token @param {string} id @param {object} input */
export function updateAdminInvoice(token, id, input) { return apiRequest(`${api.endpoints.adminInvoices}/${id}`, { method: "PATCH", token, body: input }); }
/** @param {string} token @param {string} id */
export function deleteAdminInvoice(token, id) { return apiRequest(`${api.endpoints.adminInvoices}/${id}`, { method: "DELETE", token }); }
