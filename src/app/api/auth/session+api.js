import { jsonResponse, methodNotAllowed } from "../../../shared/api.js";
import { authenticateRequest, publicProfile } from "../../../shared/api-auth.js";

/**
 * Current-session endpoint (`src/app/api/auth/session+api.js`): validates the
 * bearer token and returns the caller's public profile.
 * @module app/api/auth/session+api
 */

/**
 * GET handler for `/api/auth/session`.
 *
 * @param {Request} request - Incoming request with an `Authorization: Bearer <token>` header.
 * @returns {Promise<Response>} The authenticated profile, or a standardized 401/403 error.
 */
export async function GET(request) {
  const auth = await authenticateRequest(request);

  if (auth.error) {
    return auth.error;
  }

  return jsonResponse({
    user: publicProfile(auth.profile)
  });
}

/**
 * Rejects unsupported methods.
 *
 * @returns {Response} `405 Method Not Allowed`.
 */
export function POST() {
  return methodNotAllowed("GET");
}
