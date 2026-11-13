import { errorInterceptor } from "../interceptors/error-interceptor.js";
import { logInterceptor } from "../interceptors/log-interceptor.js";
import { methodInterceptor } from "../interceptors/method-interceptor.js";
import { withMiddleware } from "../shared/network/middleware.js";
import { jsonResponse } from "../shared/network/response.js";

/**
 * Composed health-check endpoint handlers.
 * @module endpoints/health
 */

function healthResponse() {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(() => healthResponse());

export const GET = route;
export const POST = route;
