import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { signUp } from "../../repositories/auth-repository.js";

/**
 * Composed sign-up endpoint handlers.
 * @module endpoints/sign-up/index
 */

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

async function parseSignUpRequest(request) {
  const body = await readJsonBody(request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username)) {
    throw badRequest("invalid_username", "Choose a valid username (3-32 chars, lowercase letters, numbers, ., _, -).");
  }

  if (password.length < 6) {
    throw badRequest("invalid_password", "Password must be at least 6 characters.");
  }

  return {
    username,
    password,
    email: loginEmailForUsername(username)
  };
}

function signUpResponse(data) {
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseSignUpRequest(context.request);
  return signUpResponse(await signUp(input));
});

export const GET = route;
export const POST = route;
