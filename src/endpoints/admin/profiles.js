import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { jsonResponse } from "../../shared/network/response.js";
import { listProfiles } from "../../repositories/profile-repository.js";

/**
 * Composed admin profiles endpoint handlers.
 * @module endpoints/admin/profiles
 */

function adminProfilesResponse(data) {
  return jsonResponse(data);
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => adminProfilesResponse(await listProfiles(context.locals.auth.database)));

export const GET = route;
export const POST = route;
