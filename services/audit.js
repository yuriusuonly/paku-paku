import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API audit log contracts.
 * @module services/audit
 */

/**
 * Loads recent audit logs for administrators.
 *
 * @param {string} token - Admin access token.
 * @param {{limit?: number}} [options] - List options.
 * @returns {Promise<{logs: object[]}>} Audit logs payload.
 */
export function getAuditLogs(token, { limit = 100 } = {}) {
  return apiRequest(`${api.endpoints.adminAuditLogs}?limit=${limit}`, { token });
}
