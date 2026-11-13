import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody
} from "../../../shared/api.js";
import { signIn } from "../../../services/server/auth-service.js";

/**
 * Username/password sign-in endpoint.
 * @module app/api/auth/sign-in+api
 */

/**
 * POST handler for `/api/auth/sign-in`.
 *
 * @param {Request} request - Incoming request with `{ username, password }` JSON.
 * @returns {Promise<Response>} Session tokens and public profile, or an error response.
 */
export async function POST(request) {
  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse(400, "invalid_body", "Expected a JSON object with username and password.");
  }

  const result = await signIn(body);

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
export function GET() {
  return methodNotAllowed("POST");
}
