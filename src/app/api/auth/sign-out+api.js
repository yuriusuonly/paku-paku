import { signOut } from "../../../services/server/auth-service.js";
import { withErrorHandling, withMethods, withMiddleware } from "../../../interceptors/index.js";

/**
 * Sign-out endpoint.
 * @module app/api/auth/sign-out+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("POST")
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
