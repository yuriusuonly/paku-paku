/**
 * Shared helpers for Expo Router API routes: JSON responses, consistent error
 * envelopes, request-body parsing, and bearer-token extraction.
 * @module shared/api
 */

/**
 * Headers applied to every API response so authenticated payloads are never
 * cached by browsers, proxies, or the Expo Hosting edge.
 *
 * @type {Record<string, string>}
 */
const noStoreHeaders = {
  "Cache-Control": "no-store"
};

/**
 * Creates a JSON response with the shared no-store cache policy.
 *
 * @param {unknown} data - JSON-serializable response body.
 * @param {object} [options] - Response options.
 * @param {number} [options.status=200] - HTTP status code.
 * @param {Record<string, string>} [options.headers] - Extra response headers.
 * @returns {Response} JSON response.
 */
export function jsonResponse(data, { status = 200, headers = {} } = {}) {
  return Response.json(data, {
    status,
    headers: {
      ...noStoreHeaders,
      ...headers
    }
  });
}

/**
 * Creates a standardized error response.
 *
 * @param {number} status - HTTP status code.
 * @param {string} code - Stable machine-readable error code.
 * @param {string} message - Human-readable error message.
 * @param {object} [options] - Response options.
 * @param {Record<string, string>} [options.headers] - Extra response headers.
 * @returns {Response} JSON error response shaped as `{ error: { code, message } }`.
 */
export function errorResponse(status, code, message, { headers = {} } = {}) {
  return jsonResponse(
    {
      error: {
        code,
        message
      }
    },
    {
      status,
      headers
    }
  );
}

/**
 * Creates a `405 Method Not Allowed` response that advertises the verbs the
 * route supports.
 *
 * @param {string} allow - Comma-separated list of allowed HTTP methods.
 * @returns {Response} JSON error response with an `Allow` header.
 */
export function methodNotAllowed(allow) {
  return errorResponse(405, "method_not_allowed", `Use ${allow}.`, {
    headers: {
      Allow: allow
    }
  });
}

/**
 * Parses a JSON object body from a request.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<Record<string, unknown> | null>} The parsed object, or `null` when the body is missing, malformed, or not an object.
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
 * @returns {string | null} The token, or `null` when the header is missing or not a bearer credential.
 */
export function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}
