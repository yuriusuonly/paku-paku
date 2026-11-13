import { errorResponse, methodNotAllowed } from "../../../shared/api.js";
import { signOut } from "../../../services/server/auth-service.js";

/**
 * Sign-out endpoint: revokes the current session in GoTrue.
 * @module app/api/auth/sign-out+api
 */

/**
 * POST handler for `/api/auth/sign-out`.
 *
 * @param {Request} request - Incoming request with an `Authorization: Bearer <token>` header.
 * @returns {Promise<Response>} `204 No Content` on success, or an error response.
 */
export async function POST(request) {
  const result = await signOut(request);

  if (!result.ok) {
    return errorResponse(result.status, result.code, result.message);
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

/**
 * Rejects unsupported methods.
 *
 * @returns {Response} `405 Method Not Allowed`.
 */
export function GET() {
  return methodNotAllowed("POST");
}
