import { errorResponse, jsonResponse, methodNotAllowed } from "../../../shared/api.js";
import { authenticateAdmin, PROFILE_COLUMNS, publicProfile } from "../../../shared/api-auth.js";

/**
 * Admin-only profiles endpoint (`src/app/api/admin/profiles+api.js`). The
 * `Admins can read every profile` RLS policy backs the query, and
 * `authenticateAdmin` rejects non-admin tokens before it runs.
 * @module app/api/admin/profiles+api
 */

/**
 * GET handler for `/api/admin/profiles`.
 *
 * @param {Request} request - Incoming request with an admin bearer token.
 * @returns {Promise<Response>} Every profile ordered by username, or a standardized 401/403 error.
 */
export async function GET(request) {
  const auth = await authenticateAdmin(request);

  if (auth.error) {
    return auth.error;
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("username", { ascending: true });

  if (error) {
    return errorResponse(502, "profiles_unavailable", "Could not load profiles.");
  }

  return jsonResponse({
    profiles: data.map(publicProfile)
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
