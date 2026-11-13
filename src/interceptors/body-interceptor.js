import { badRequest } from "../shared/errors/bad-request.js";
import { readJsonBody } from "../shared/network/request.js";

/**
 * JSON body parsing interceptor.
 * @module interceptors/body-interceptor
 */

/**
 * @typedef {import("./context.js").ApiContext} ApiContext
 */

/**
 * Parses a JSON object body into `context.body` for write methods.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function bodyInterceptor(context, next) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(context.method)) {
    const body = await readJsonBody(context.request);
    if (body === null) {
      throw badRequest("invalid_body", "Expected a JSON object body.");
    }
    context.body = body;
  }
  return next();
}
