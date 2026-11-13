/**
 * API response helpers.
 * @module responses
 */

/**
 * Headers applied to every API response so payloads are never cached.
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
 * @returns {Response} JSON error response.
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
 * Creates a `405 Method Not Allowed` response.
 *
 * @param {string} allow - Comma-separated allowed HTTP methods.
 * @returns {Response} Error response.
 */
export function methodNotAllowed(allow) {
  return errorResponse(405, "method_not_allowed", `Use ${allow}.`, {
    headers: {
      Allow: allow
    }
  });
}

/**
 * Creates a successful JSON response.
 *
 * @param {any} data - Response payload.
 * @param {number} [status=200] - HTTP status.
 * @returns {Response} JSON response.
 */
export function ok(data, status = 200) {
  return jsonResponse(data, { status });
}
