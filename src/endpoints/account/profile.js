import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { toPublicProfile } from "../../repositories/profile-repository.js";
import { updatePassword } from "../../repositories/auth-repository.js";

/**
 * Authenticated account endpoint handlers.
 * @module endpoints/account/profile
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse({ profile: toPublicProfile(context.locals.auth.profile) })
);

export const PATCH = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("PATCH"), authenticationInterceptor)(
  async (context) => {
    const body = await readJsonBody(context.request);
    if (!body) throw badRequest("invalid_body", "Expected a JSON object with account fields.");
    if (typeof body.password === "string" || typeof body.new_password === "string") {
      const password = typeof body.password === "string" ? body.password : body.new_password;
      return jsonResponse(await updatePassword(context.locals.auth.database, password));
    }
    throw badRequest("invalid_body", "No supported account fields to update.");
  }
);

export function POST() { return methodNotAllowed("GET, PATCH"); }
export function PUT() { return methodNotAllowed("GET, PATCH"); }
export function DELETE() { return methodNotAllowed("GET, PATCH"); }
