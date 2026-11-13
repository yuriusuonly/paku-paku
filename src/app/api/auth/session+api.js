import {
  authenticationInterceptor,
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../../interceptors/index.js";
import { getSession } from "../../../repositories/auth-repository.js";
import { ok } from "../../../responses/index.js";

/**
 * Current-session endpoint.
 * @module app/api/auth/session+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => ok(await getSession(context.request)));

export { route as GET, route as POST };
