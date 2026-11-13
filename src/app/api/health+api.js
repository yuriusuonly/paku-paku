import {
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../interceptors/index.js";
import { ok } from "../../responses/index.js";

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
