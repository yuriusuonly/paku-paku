import {
  authorizationInterceptor,
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../../interceptors/index.js";
import { listProfiles } from "../../../repositories/profile-repository.js";
import { ok } from "../../../responses/index.js";

/**
 * Admin-only profiles endpoint.
 * @module app/api/admin/profiles+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => ok(await listProfiles(context.locals.auth.supabase)));

export { route as GET, route as POST };
