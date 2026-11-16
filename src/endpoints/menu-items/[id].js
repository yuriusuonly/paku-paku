import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { deleteMenuItem, updateMenuItem } from "../../repositories/menu-repository.js";
import { normalizeMenuItemInput } from "./validation.js";
import { readRouteId, requireObjectBody } from "../../shared/validation/request.js";

/**
 * Composed menu item endpoint handlers (by id).
 * @module endpoints/menu-items/[id]
 */

async function parseUpdateMenuItemRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with menu item fields."
  );
  return normalizeMenuItemInput(body, { partial: true });
}

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseUpdateMenuItemRequest(context.request);
  return jsonResponse(
    await updateMenuItem(context.locals.auth.database, readRouteId(context), input)
  );
});

export const DELETE = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("DELETE"),
  authorizationInterceptor
)(async (context) =>
  jsonResponse(await deleteMenuItem(context.locals.auth.database, readRouteId(context)))
);

export function GET() {
  return methodNotAllowed("PATCH, DELETE");
}

export function POST() {
  return methodNotAllowed("PATCH, DELETE");
}

export function PUT() {
  return methodNotAllowed("PATCH, DELETE");
}
