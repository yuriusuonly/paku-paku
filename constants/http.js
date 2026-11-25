/**
 * HTTP status code constants.
 * @module constants/http
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
