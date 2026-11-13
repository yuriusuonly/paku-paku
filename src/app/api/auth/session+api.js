import { errorResponse, jsonResponse, methodNotAllowed } from "../../../shared/api.js";
import { getSession } from "../../../services/server/auth-service.js";

/**
 * Current-session endpoint: validates bearer token and returns the profile.
 * @module app/api/auth/session+api
 */

/**
 * GET handler for `/api/auth/session`.
 *
 * @param {Request} request - Incoming request with an `Authorization: Bearer <token>` header.
 * @returns {Promise<Response>} Authenticated profile or an error response.
 */
export async function GET(request) {
  const result = await getSession(request);

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
