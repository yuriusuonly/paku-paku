import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse } from "../../shared/network/response.js";
import { signIn } from "../../repositories/auth-repository.js";

/**
 * Composed sign-in endpoint handlers.
 * @module endpoints/signin/index
 */

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

async function parseSignInRequest(request) {
  const body = await readJsonBody(request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    throw badRequest("invalid_credentials", "Enter a valid username and password.");
  }

  return {
    username,
    password,
    email: loginEmailForUsername(username)
  };
}

function signInResponse(data) {
  return jsonResponse(data);
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const credentials = await parseSignInRequest(context.request);
  return signInResponse(await signIn(credentials));
});

export const GET = route;
export const POST = route;
