import { errorInterceptor } from "../interceptors/error-interceptor.js";
import { logInterceptor } from "../interceptors/log-interceptor.js";
import { methodInterceptor } from "../interceptors/method-interceptor.js";
import { withMiddleware } from "../network/middleware.js";
import { parseSignInRequest } from "../requests/sign-in.js";
import { signIn } from "../repositories/auth-repository.js";
import { signInResponse } from "../responses/sign-in.js";

/**
 * Composed sign-in endpoint handlers.
 * @module endpoints/sign-in
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const credentials = await parseSignInRequest(context.request);
  return signInResponse(await signIn(credentials));
});

export const GET = route;
export const POST = route;
