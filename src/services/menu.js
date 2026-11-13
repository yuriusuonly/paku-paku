import { api } from "../shared/config.js";
import { apiRequest } from "../shared/http.js";

/**
 * Client-to-API menu contracts.
 * @module services/menu
 */

/**
 * Loads available menu items for a signed-in user.
 *
 * @param {string} token - Access token.
 * @returns {Promise<{items: object[]}>} Menu payload.
 */
export function getMenuItems(token) {
  return apiRequest(api.endpoints.menuItems, { token });
}
