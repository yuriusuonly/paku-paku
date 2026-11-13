import { listProfiles } from "../../../services/server/profile-service.js";
import {
  ok,
  withAdminAuth,
  withErrorHandling,
  withMethods,
  withMiddleware
} from "../../../interceptors/index.js";

/**
 * Admin-only profiles endpoint.
 * @module app/api/admin/profiles+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("GET"),
  withAdminAuth
)(async (context) => ok(await listProfiles(context.locals.auth.supabase)));

export { route as GET, route as POST };
