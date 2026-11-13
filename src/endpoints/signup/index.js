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
 * @module endpoints/signup/index
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function deriveUsername(email) {
  const local = email.split("@")[0] || "user";
  let username = local.replace(/[^a-z0-9_.-]/g, "").toLowerCase();
  if (!/^[a-z0-9]/.test(username)) username = `u${username}`;
  username = username.slice(0, 32);
  if (username.length < 3) username = (username + "user").slice(0, 32);
  if (!USERNAME_PATTERN.test(username)) username = "user";
  return username;
}

async function parseSignUpRequest(request) {
  const body = await readJsonBody(request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with email and password.");
  }

  const email = normalizeEmail(body.email ?? body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    throw badRequest("invalid_email", "Enter a valid email address.");
  }

  if (password.length < 6) {
    throw badRequest("invalid_password", "Password must be at least 6 characters.");
  }

  return {
    username: deriveUsername(email),
    password,
    email
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
