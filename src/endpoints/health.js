import { errorInterceptor } from "../interceptors/error-interceptor.js";
import { logInterceptor } from "../interceptors/log-interceptor.js";
import { methodInterceptor } from "../interceptors/method-interceptor.js";
import { withMiddleware } from "../network/middleware.js";
import { healthResponse } from "../responses/health.js";

/**
 * Composed health-check endpoint handlers.
 * @module endpoints/health
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(() => healthResponse());

export const GET = route;
export const POST = route;
