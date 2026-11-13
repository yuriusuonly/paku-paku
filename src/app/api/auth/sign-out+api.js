import {
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../../interceptors/index.js";
import { signOut } from "../../../repositories/auth-repository.js";

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
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store"
    }
  });
});

export { route as GET, route as POST };
