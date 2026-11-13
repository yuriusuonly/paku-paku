/**
 * HTTP utilities and client-to-API transport helpers.
 * @module shared/http
 */

/**
 * Common HTTP status code constants.
 *
 * @type {{OK: number, CREATED: number, NO_CONTENT: number, BAD_REQUEST: number, UNAUTHORIZED: number, FORBIDDEN: number, NOT_FOUND: number, METHOD_NOT_ALLOWED: number, CONFLICT: number, TOO_MANY_REQUESTS: number, INTERNAL_SERVER_ERROR: number, BAD_GATEWAY: number, SERVICE_UNAVAILABLE: number}}
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

/**
 * @typedef {object} ApiError
 * @property {number} status - HTTP status code.
 * @property {string} code - Machine-readable error code.
 * @property {string} message - Human-readable error message.
 */

/**
 * Builds a request error object from a non-OK API response.
 *
 * @param {Response} response - Fetch response.
 * @param {any} payload - Parsed JSON payload when available.
 * @returns {ApiError} Normalized API error.
 */
function toApiError(response, payload) {
  const error = payload && typeof payload === "object" ? payload.error : null;

  return {
    status: response.status,
    code: error && typeof error.code === "string" ? error.code : "request_failed",
    message:
      error && typeof error.message === "string"
        ? error.message
        : "The request could not be completed."
  };
}

/**
 * Performs a JSON request against a same-origin API route.
 *
 * @param {string} path - API path such as `/api/menu-items`.
 * @param {object} [options] - Request options.
 * @param {string} [options.method="GET"] - HTTP method.
 * @param {unknown} [options.body] - JSON request body.
 * @param {string} [options.token] - Bearer access token.
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {ApiError} When the response is not successful.
 */
export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw {
      status: 0,
      code: "network_error",
      message: "Unable to reach the server."
    };
  }

  if (response.status === HTTP_STATUS.NO_CONTENT) {
    return null;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw toApiError(response, payload);
  }

  return payload;
}
