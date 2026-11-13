import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../network/middleware.js";
import { signOut } from "../../repositories/auth-repository.js";
import { signOutResponse } from "../../responses/sign-out.js";

/**
 * Composed sign-out endpoint handlers.
 * @module endpoints/sign-out/index
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  await signOut(context.request);
  return signOutResponse();
});

export const GET = route;
export const POST = route;
