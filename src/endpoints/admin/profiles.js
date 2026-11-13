import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { listProfiles, updateProfile } from "../../repositories/profile-repository.js";
import { createManagedUser } from "../../repositories/auth-repository.js";

/**
 * Composed admin profiles endpoint handlers.
 * @module endpoints/admin/profiles
 */

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

async function parseCreateUserRequest(request) {
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

  return { username, password, email: loginEmailForUsername(username) };
}

async function parseUpdateProfileRequest(request) {
  const body = await readJsonBody(request);
  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with profile fields.");
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    throw badRequest("invalid_profile", "Profile id is required.");
  }

  const input = {};
  if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    input.is_active = Boolean(body.is_active);
  }

  if (Object.keys(input).length === 0) {
    throw badRequest("invalid_profile", "No profile fields to update.");
  }

  return { id, input };
}

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => jsonResponse(await listProfiles(context.locals.auth.database)));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateUserRequest(context.request);
  const data = await createManagedUser(context.locals.auth.database, input);
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
});

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const { id, input } = await parseUpdateProfileRequest(context.request);
  return jsonResponse(await updateProfile(context.locals.auth.database, id, input));
});

export function PUT() {
  return methodNotAllowed("GET, POST, PATCH");
}

export function DELETE() {
  return methodNotAllowed("GET, POST, PATCH");
}
