import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/middleware.js";
import { readJsonBody } from "../../../requests/request.js";
import { badRequest } from "../../../shared/errors.js";
import { signIn } from "../../../repositories/auth-repository.js";
import { ok } from "../../../responses/response.js";

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
