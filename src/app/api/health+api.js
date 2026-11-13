import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../network/middleware.js";
import { healthResponse } from "../../responses/health.js";

/**
 * Health-check endpoint.
 * @module app/api/health+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(() => healthResponse());

export { route as GET, route as POST };
