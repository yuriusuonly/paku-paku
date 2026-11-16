import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { HTTP_STATUS } from "../../../shared/constants/http.js";
import { createInventoryItem, listInventoryItems } from "../../../repositories/inventory-repository.js";
import { normalizeInventoryInput } from "./validation.js";
import { requireObjectBody } from "../../../shared/validation/request.js";

/**
 * Composed admin inventory collection endpoint handlers.
 * @module endpoints/admin/inventory/index
 */

async function parseCreateRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with inventory item fields."
  );
  return normalizeInventoryInput(body);
}

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => jsonResponse(await listInventoryItems(context.locals.auth.database)));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateRequest(context.request);
  return jsonResponse(
    await createInventoryItem(context.locals.auth.database, input),
    { status: HTTP_STATUS.CREATED }
  );
});

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
