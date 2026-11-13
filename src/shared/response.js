/**
 * Shared response utilities.
 * @module shared/response
 */

/**
 * @type {Record<string, string>}
 */
const noStoreHeaders = {
  "Cache-Control": "no-store"
};

/**
 * Creates a JSON response with no-store headers.
 *
 * @param {unknown} data - Response body.
 * @param {object} [options] - Response options.
 * @param {number} [options.status=200] - HTTP status.
 * @param {Record<string, string>} [options.headers] - Extra headers.
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
 * @param {number} status - HTTP status.
 * @param {string} code - Error code.
 * @param {string} message - Error message.
 * @param {object} [options] - Options.
 * @param {Record<string, string>} [options.headers] - Extra headers.
 * @returns {Response} Error response.
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
 * Creates a 405 Method Not Allowed response.
 *
 * @param {string} allow - Allowed methods.
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
 * Creates a 204 No Content response.
 *
 * @returns {Response} Empty response.
 */
export function noContent() {
  return new Response(null, {
    status: 204,
    headers: {
      ...noStoreHeaders
    }
  });
}
