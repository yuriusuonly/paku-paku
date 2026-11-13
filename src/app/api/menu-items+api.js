import { errorResponse, jsonResponse, methodNotAllowed } from "../../shared/api.js";
import { listMenuItems } from "../../services/menu-service.js";

/**
 * Public menu endpoint. RLS limits results to available items.
 * @module app/api/menu-items+api
 */

/**
 * GET handler for `/api/menu-items`.
 *
 * @returns {Promise<Response>} Available menu items or an error response.
 */
export async function GET() {
  const result = await listMenuItems();

  if (!result.ok) {
    return errorResponse(result.status, result.code, result.message);
  }

  return jsonResponse(result.data);
}

/**
 * Rejects unsupported methods.
 *
 * @returns {Response} `405 Method Not Allowed`.
 */
export function POST() {
  return methodNotAllowed("GET");
}
