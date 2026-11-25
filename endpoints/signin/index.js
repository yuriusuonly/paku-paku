import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { badRequest } from "../../errors/bad-request.js";
import { withMiddleware } from "../../network/middleware.js";
import { readJsonBody } from "../../network/request.js";
import { jsonResponse } from "../../network/response.js";
import { signIn } from "../../repositories/auth.repository.js";
import { isValidEmail } from "../../validation/email.js";
import { hasOwn, requireObjectBody } from "../../validation/request.js";

/**
 * Composed sign-in endpoint handlers.
 * @module endpoints/signin/index
 */

async function parseSignInRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with email and password."
  );

  const emailValue = hasOwn(body, "email") ? body.email : body.username;
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!isValidEmail(email) || password.length === 0) {
    throw badRequest("invalid_credentials", "Enter a valid email and password.");
  }

  return { email, password };
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const credentials = await parseSignInRequest(context.request);
  return jsonResponse(await signIn(credentials));
});

export const GET = route;
export const POST = route;
