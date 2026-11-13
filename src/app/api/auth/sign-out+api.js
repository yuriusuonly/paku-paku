import { errorResponse, getBearerToken, methodNotAllowed } from "../../../shared/api.js";
import { getSupabaseServerConfig } from "../../../shared/supabase-server.js";

/**
 * Sign-out endpoint (`src/app/api/auth/sign-out+api.js`): revokes the current
 * session in GoTrue. Sign-out is idempotent from the client's perspective.
 * @module app/api/auth/sign-out+api
 */

/**
 * POST handler for `/api/auth/sign-out`.
 *
 * @param {Request} request - Incoming request with an `Authorization: Bearer <token>` header.
 * @returns {Promise<Response>} `204 No Content` when the session is revoked or already invalid.
 */
export async function POST(request) {
  const token = getBearerToken(request);

  if (!token) {
    return errorResponse(401, "unauthorized", "Missing bearer token.");
  }

  let config;
  try {
    config = getSupabaseServerConfig();
  } catch {
    return errorResponse(503, "supabase_unconfigured", "Supabase is not configured for server routes.");
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/logout?scope=global`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    });

    // 401 means the token was already invalid, which is still a successful
    // sign-out for the caller. Other upstream failures are reported as 502.
    if (!response.ok && response.status !== 401) {
      return errorResponse(502, "sign_out_failed", "Could not revoke the session.");
    }
  } catch {
    return errorResponse(502, "sign_out_failed", "Could not revoke the session.");
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
