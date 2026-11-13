import { errorResponse, jsonResponse, methodNotAllowed } from "../../../shared/api.js";
import { authenticateAdmin } from "../../../services/auth-service.js";
import { listProfiles } from "../../../services/profile-service.js";

/**
 * Admin-only profiles endpoint.
 * @module app/api/admin/profiles+api
 */

/**
 * GET handler for `/api/admin/profiles`.
 *
 * @param {Request} request - Incoming request with an admin bearer token.
 * @returns {Promise<Response>} Profile list or an error response.
 */
export async function GET(request) {
  const auth = await authenticateAdmin(request);

  if (!auth.ok) {
    return errorResponse(auth.status, auth.code, auth.message);
  }

  const result = await listProfiles(auth.supabase);

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
