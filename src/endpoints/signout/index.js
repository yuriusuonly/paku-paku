import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { noContent } from "../../shared/network/response.js";
import { signOut } from "../../repositories/auth-repository.js";

/**
 * Composed sign-out endpoint handlers.
 * @module endpoints/signout/index
 */

function signOutResponse() {
  return noContent();
}

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
