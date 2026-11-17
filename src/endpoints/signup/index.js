import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { signUp } from "../../repositories/auth.repository.js";
import { requireEmail } from "../../shared/validation/email.js";
import { requirePassword } from "../../shared/validation/password.js";
import { hasOwn, requireObjectBody } from "../../shared/validation/request.js";

/**
 * Composed sign-up endpoint handlers.
 * @module endpoints/signup/index
 */

async function parseSignUpRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with email and password."
  );

  const email = requireEmail(hasOwn(body, "email") ? body.email : body.username);
  const password = requirePassword(body.password);

  return { email, password };
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseSignUpRequest(context.request);
  return jsonResponse(await signUp(input), { status: HTTP_STATUS.CREATED });
});

export const GET = route;
export const POST = route;
