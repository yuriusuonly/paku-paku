import { authenticationInterceptor } from "../../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/middleware.js";
import { getSession } from "../../../repositories/auth-repository.js";
import { sessionResponse } from "../../../responses/auth/session.js";

/**
 * Current-session endpoint.
 * @module app/api/auth/session+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => sessionResponse(await getSession(context.request)));

export { route as GET, route as POST };
