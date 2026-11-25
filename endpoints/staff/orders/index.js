import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { staffAuthorizationInterceptor } from "../../../interceptors/staff-authorization.interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { readJsonBody } from "../../../network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../network/response.js";
import { HTTP_STATUS } from "../../../constants/http.js";
import { createOrder, listOrders } from "../../../repositories/order.repository.js";
import { orderCreateSchema } from "../../../domain/orders/schema.js";
import { parseWithSchema, requireObjectBody } from "../../../validation/request.js";

/**
 * Staff order logs and manual order taking endpoints.
 * @module endpoints/staff/orders/index
 */

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  staffAuthorizationInterceptor
)(async (context) => jsonResponse(await listOrders(context.locals.auth.database)));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  staffAuthorizationInterceptor
)(async (context) => {
  const body = requireObjectBody(
    await readJsonBody(context.request),
    "Expected a JSON object with order fields."
  );
  const input = parseWithSchema(orderCreateSchema, body, {
    code: "invalid_order",
    message: "Invalid order."
  });
  return jsonResponse(
    await createOrder(context.locals.auth.database, input),
    { status: HTTP_STATUS.CREATED }
  );
});

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
