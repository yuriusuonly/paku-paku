import { authorizationInterceptor } from "../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { badRequest } from "../../errors/bad-request.js";
import { withMiddleware } from "../../network/middleware.js";
import { readJsonBody } from "../../network/request.js";
import { jsonResponse, methodNotAllowed } from "../../network/response.js";
import { listProfiles, updateProfile } from "../../repositories/profile.repository.js";
import {
  hasOwn,
  readBoolean,
  readRouteId,
  requireObjectBody,
  requireUpdateFields
} from "../../validation/request.js";

/**
 * Composed admin profiles endpoint handlers.
 * Profiles are read-only records; new accounts are not created from the app.
 * @module endpoints/admin/profiles
 */

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

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const { id, input } = await parseUpdateProfileRequest(context.request);
  return jsonResponse(await updateProfile(context.locals.auth.database, id, input));
});

export function POST() {
  return methodNotAllowed("GET, PATCH");
}

export function PUT() {
  return methodNotAllowed("GET, PATCH");
}

export function DELETE() {
  return methodNotAllowed("GET, PATCH");
}
