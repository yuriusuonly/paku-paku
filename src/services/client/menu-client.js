import { apiRequest } from "./http.js";

/**
 * Client-side menu API calls.
 * @module services/menu-client
 */

/**
 * Loads available menu items.
 *
 * @returns {Promise<{items: object[]}>} Menu payload.
 */
export function getMenuItems() {
  return apiRequest("/api/menu-items");
}
