import { ok, withErrorHandling, withMethods, withMiddleware } from "../../interceptors/index.js";

/**
 * Health-check endpoint.
 * @module app/api/health+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("GET")
)(() =>
  ok({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
);

export { route as GET, route as POST };
