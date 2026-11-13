/**
 * Shared request parsing utilities.
 * @module shared/request
 */

/**
 * Parses a JSON object body from a request.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<Record<string, unknown> | null>} Parsed object, or `null` when invalid.
 */
export async function readJsonBody(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

/**
 * Extracts a bearer token from the `Authorization` header.
 *
 * @param {Request} request - Incoming web request.
 * @returns {string | null} Bearer token or `null`.
 */
export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}
