import {
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../../interceptors/index.js";
import { readJsonBody } from "../../../requests/index.js";
import { badRequest } from "../../../shared/errors.js";
import { signIn } from "../../../repositories/auth-repository.js";
import { ok } from "../../../responses/index.js";

/**
 * Username/password sign-in endpoint.
 * @module app/api/auth/sign-in+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const body = await readJsonBody(context.request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  return ok(await signIn(body));
});

export { route as GET, route as POST };
