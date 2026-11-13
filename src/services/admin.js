import { api } from "../shared/config.js";
import { apiRequest } from "../network/http.js";

/**
 * Client-to-API admin contracts.
 * @module services/admin
 */

/**
 * Loads all profiles for an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @returns {Promise<{profiles: object[]}>} Profiles payload.
 */
export function getProfiles(token) {
  return apiRequest(api.endpoints.adminProfiles, {
    token
  });
}
