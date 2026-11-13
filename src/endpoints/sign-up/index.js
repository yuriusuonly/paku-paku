import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../network/middleware.js";
import { parseSignUpRequest } from "../../requests/sign-up.js";
import { signUp } from "../../repositories/auth-repository.js";
import { signUpResponse } from "../../responses/sign-up.js";

/**
 * Composed sign-up endpoint handlers.
 * @module endpoints/sign-up/index
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseSignUpRequest(context.request);
  return signUpResponse(await signUp(input));
});

export const GET = route;
export const POST = route;
