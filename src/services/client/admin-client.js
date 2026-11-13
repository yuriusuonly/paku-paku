import { api } from "../../shared/config.js";
import { apiRequest } from "./http.js";

/**
 * Client-side admin API calls.
 * @module services/client/admin-client
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
