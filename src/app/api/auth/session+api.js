import { getSession } from "../../../services/server/auth-service.js";
import {
  ok,
  withAuth,
  withErrorHandling,
  withMethods,
  withMiddleware
} from "../../../interceptors/index.js";

/**
 * Current-session endpoint.
 * @module app/api/auth/session+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("GET"),
  withAuth
)(async (context) => ok(await getSession(context.request)));

export { route as GET, route as POST };
