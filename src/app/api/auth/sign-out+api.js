import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/middleware.js";
import { signOut } from "../../../repositories/auth-repository.js";
import { signOutResponse } from "../../../responses/auth/sign-out.js";

/**
 * Sign-out endpoint.
 * @module app/api/auth/sign-out+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  await signOut(context.request);
  return signOutResponse();
});

export { route as GET, route as POST };
