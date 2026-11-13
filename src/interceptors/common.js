import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody
} from "../shared/api.js";
import { badRequest, normalizeError } from "../shared/errors.js";
import { authenticate, authenticateAdmin } from "../services/server/auth-service.js";

/**
 * Common API middleware/interceptors.
 * @module interceptors/common
 */

/**
 * @typedef {import("./context.js").ApiContext} ApiContext
 */

/**
 * Catches errors and maps them to standardized HTTP error responses.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function withErrorHandling(context, next) {
  try {
    return await next();
  } catch (error) {
    const appError = normalizeError(error);
    const message = appError.expose || appError.status < 500
      ? appError.message
      : "An unexpected error occurred.";
    return errorResponse(appError.status, appError.code, message);
  }
}

/**
 * Enforces an allowed HTTP method.
 *
 * @param {...string} methods - Allowed methods (e.g. `"GET"`, `"POST"`).
 * @returns {(context: ApiContext, next: () => Promise<Response>) => Promise<Response>} Middleware.
 */
export function withMethods(...methods) {
  const allowed = methods.map((method) => method.toUpperCase());

  return async (context, next) => {
    if (!allowed.includes(context.method)) {
      return methodNotAllowed(allowed.join(", "));
    }
    return next();
  };
}

/**
 * Parses a JSON object body into `context.body` for write methods.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function withJsonBody(context, next) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(context.method)) {
    const body = await readJsonBody(context.request);
    if (body === null) {
      throw badRequest("invalid_body", "Expected a JSON object body.");
    }
    context.body = body;
  }
  return next();
}

/**
 * Authenticates the request and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function withAuth(context, next) {
  context.locals.auth = await authenticate(context.request);
  return next();
}

/**
 * Requires an authenticated administrator and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function withAdminAuth(context, next) {
  context.locals.auth = await authenticateAdmin(context.request);
  return next();
}

/**
 * Creates a handler that returns a JSON payload from service result data.
 *
 * @param {any} data - Response payload.
 * @param {number} [status=200] - HTTP status.
 * @returns {Response} JSON response.
 */
export function ok(data, status = 200) {
  return jsonResponse(data, { status });
}
