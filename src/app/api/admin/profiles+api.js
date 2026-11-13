import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/middleware.js";
import { listProfiles } from "../../../repositories/profile-repository.js";
import { adminProfilesResponse } from "../../../responses/admin/profiles.js";

/**
 * Admin-only profiles endpoint.
 * @module app/api/admin/profiles+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => adminProfilesResponse(await listProfiles(context.locals.auth.supabase)));

export { route as GET, route as POST };
