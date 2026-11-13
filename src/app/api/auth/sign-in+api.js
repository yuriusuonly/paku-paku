import { readJsonBody } from "../../../shared/api.js";
import { badRequest } from "../../../shared/errors.js";
import { signIn } from "../../../services/server/auth-service.js";
import { ok, withErrorHandling, withMethods, withMiddleware } from "../../../interceptors/index.js";

/**
 * Username/password sign-in endpoint.
 * @module app/api/auth/sign-in+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("POST")
)(async (context) => {
  const body = await readJsonBody(context.request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  const data = await signIn(body);
  return ok(data);
});

export { route as GET, route as POST };
