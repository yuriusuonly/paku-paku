import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/middleware.js";
import { ok } from "../../responses/response.js";

/**
 * Health-check endpoint.
 * @module app/api/health+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(() =>
  ok({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
);

export { route as GET, route as POST };
