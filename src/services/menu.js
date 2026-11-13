import { api } from "../shared/config.js";
import { apiRequest } from "./http.js";

/**
 * Client-to-API menu contracts.
 * @module services/menu
 */

/**
 * Loads available menu items.
 *
 * @returns {Promise<{items: object[]}>} Menu payload.
 */
export function getMenuItems() {
  return apiRequest(api.endpoints.menuItems);
}
