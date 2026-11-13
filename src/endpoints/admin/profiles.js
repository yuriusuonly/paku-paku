import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../network/middleware.js";
import { listProfiles } from "../../repositories/profile-repository.js";
import { adminProfilesResponse } from "../../responses/admin-profiles.js";

/**
 * Composed admin profiles endpoint handlers.
 * @module endpoints/admin/profiles
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => adminProfilesResponse(await listProfiles(context.locals.auth.database)));

export const GET = route;
export const POST = route;
