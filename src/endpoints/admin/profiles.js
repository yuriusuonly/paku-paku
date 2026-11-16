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
import { requireEmail } from "../../shared/validation/email.js";
import { requirePassword } from "../../shared/validation/password.js";
import {
  hasOwn,
  readBoolean,
  readRouteId,
  requireObjectBody,
  requireUpdateFields
} from "../../shared/validation/request.js";

/**
 * Composed admin profiles endpoint handlers.
 * @module endpoints/admin/profiles
 */

async function parseCreateUserRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with email and password."
  );

  return {
    email: requireEmail(body.email ?? body.username),
    password: requirePassword(body.password)
  };
}

async function parseUpdateProfileRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with profile fields."
  );

  if (!hasOwn(body, "id")) {
    throw badRequest("invalid_profile", "Profile id is required.");
  }

  const id = readRouteId({ params: { id: body.id } }, {
    code: "invalid_profile",
    message: "Profile id is required."
  });

  const input = {};
  if (hasOwn(body, "is_active")) {
    input.is_active = readBoolean(body.is_active, {
      code: "invalid_profile",
      message: "Profile is_active must be a boolean."
    });
  }

  requireUpdateFields(input, {
    code: "invalid_profile",
    message: "No profile fields to update."
  });

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
