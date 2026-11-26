import { api } from "../constants/config.js";
import { apiRequest } from "../network/transport.js";

/**
 * Client-to-API administration contracts.
 * @module services/admin
 */

/**
 * Loads all profiles for an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @returns {Promise<{profiles: object[]}>} Profiles payload.
 */
export function getProfiles(token) {
  return apiRequest(api.endpoints.adminProfiles, { token });
}

/**
 * Updates a profile's management fields as an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @param {{id: string, is_active?: boolean}} input - Profile update payload.
 * @returns {Promise<{profile: object}>} Updated profile payload.
 */
export function updateProfile(token, input) {
  return apiRequest(api.endpoints.adminProfiles, {
    method: "PATCH",
    token,
    body: input
  });
}
