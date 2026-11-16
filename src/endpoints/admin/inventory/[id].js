import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { deleteInventoryItem, updateInventoryItem } from "../../../repositories/inventory-repository.js";
import { normalizeInventoryInput } from "./validation.js";
import { readRouteId, requireObjectBody } from "../../../shared/validation/request.js";

/**
 * Composed admin inventory item endpoint handlers (by id).
 * @module endpoints/admin/inventory/[id]
 */

async function parseUpdateRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with inventory item fields."
  );
  return normalizeInventoryInput(body, { partial: true });
}

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseUpdateRequest(context.request);
  return jsonResponse(
    await updateInventoryItem(context.locals.auth.database, readRouteId(context), input)
  );
});

export const DELETE = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("DELETE"),
  authorizationInterceptor
)(async (context) =>
  jsonResponse(await deleteInventoryItem(context.locals.auth.database, readRouteId(context)))
);

export function GET() { return methodNotAllowed("PATCH, DELETE"); }
export function POST() { return methodNotAllowed("PATCH, DELETE"); }
export function PUT() { return methodNotAllowed("PATCH, DELETE"); }
