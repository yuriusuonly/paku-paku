import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/middleware.js";
import { listMenuItems } from "../../repositories/menu-repository.js";
import { menuItemsResponse } from "../../responses/menu-items.js";

/**
 * Authenticated menu endpoint.
 * @module app/api/menu-items+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => menuItemsResponse(await listMenuItems(context.locals.auth.supabase)));

export { route as GET, route as POST };
