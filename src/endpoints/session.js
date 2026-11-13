import { authenticationInterceptor } from "../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../interceptors/error-interceptor.js";
import { logInterceptor } from "../interceptors/log-interceptor.js";
import { methodInterceptor } from "../interceptors/method-interceptor.js";
import { withMiddleware } from "../network/middleware.js";
import { getSession } from "../repositories/auth-repository.js";
import { sessionResponse } from "../responses/session.js";

/**
 * Composed session endpoint handlers.
 * @module endpoints/session
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => sessionResponse(await getSession(context.request)));

export const GET = route;
export const POST = route;
