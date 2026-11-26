import { authorizationInterceptor } from "../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../network/middleware.js";
import { readJsonBody } from "../../network/request.js";
import { jsonResponse, methodNotAllowed } from "../../network/response.js";
import { HTTP_STATUS } from "../../constants/http.js";
import { createItem, listItems } from "../../repositories/item.repository.js";
import { normalizeItemInput } from "./validation.js";
import { requireObjectBody } from "../../validation/request.js";

/**
 * Composed items collection endpoint handlers.
 * @module endpoints/items/index
 */

async function parseCreateItemRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with item fields."
  );
  return normalizeItemInput(body);
}

const itemsResponse = (data) => jsonResponse(data);
const itemCreatedResponse = (data) => jsonResponse(data, { status: HTTP_STATUS.CREATED });

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(async () => itemsResponse(await listItems()));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateItemRequest(context.request);
  return itemCreatedResponse(await createItem(context.locals.auth.database, input));
});

export function PUT() {
  return methodNotAllowed("GET, POST");
}

export function PATCH() {
  return methodNotAllowed("GET, POST");
}

export function DELETE() {
  return methodNotAllowed("GET, POST");
}
