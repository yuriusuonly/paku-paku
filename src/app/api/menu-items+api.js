import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/middleware.js";
import { listMenuItems } from "../../repositories/menu-repository.js";
import { ok } from "../../responses/response.js";

/**
 * Public menu endpoint.
 * @module app/api/menu-items+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(async () => ok(await listMenuItems()));

export { route as GET, route as POST };
