import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { parseSignUpRequest } from "../../../requests/auth-signup.js";
import { signUp } from "../../../repositories/auth-repository.js";
import { signUpResponse } from "../../../responses/auth-signup.js";

/**
 * Customer sign-up endpoint.
 * @module app/api/auth/signup+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseSignUpRequest(context.request);
  return signUpResponse(await signUp(input));
});

export { route as GET, route as POST };
