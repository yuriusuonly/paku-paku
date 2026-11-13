import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { parseSignInRequest } from "../../../requests/auth-sign-in.js";
import { signIn } from "../../../repositories/auth-repository.js";
import { signInResponse } from "../../../responses/auth-sign-in.js";

/**
 * Username/password sign-in endpoint.
 * @module app/api/auth/sign-in+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const credentials = await parseSignInRequest(context.request);
  return signInResponse(await signIn(credentials));
});

export { route as GET, route as POST };
