import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/middleware.js";
import { parseRegisterRequest } from "../../../requests/auth/register.js";
import { register } from "../../../repositories/auth-repository.js";
import { registerResponse } from "../../../responses/auth/register.js";

/**
 * Customer registration endpoint.
 * @module app/api/auth/register+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseRegisterRequest(context.request);
  return registerResponse(await register(input));
});

export { route as GET, route as POST };
