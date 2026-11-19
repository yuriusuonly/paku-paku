import { z } from "zod";
import { staffAuthorizationInterceptor } from "../../../interceptors/staff-authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { parseWithSchema, readRouteId, requireObjectBody } from "../../../shared/validation/request.js";
import { updateOrder } from "../../../repositories/order.repository.js";
import { ORDER_STATUSES } from "../../../domain/orders/constants.js";

/**
 * Staff counter order completion endpoint.
 * @module endpoints/staff/orders/[id]
 */

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES)
});

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  staffAuthorizationInterceptor
)(async (context) => {
  const body = requireObjectBody(
    await readJsonBody(context.request),
    "Expected a JSON object with order status."
  );
  const input = parseWithSchema(bodySchema, body, {
    code: "invalid_order_status",
    message: "Invalid order status."
  });
  return jsonResponse(
    await updateOrder(context.locals.auth.database, readRouteId(context), { status: input.status })
  );
});

export function GET() { return methodNotAllowed("PATCH"); }
export function POST() { return methodNotAllowed("PATCH"); }
export function PUT() { return methodNotAllowed("PATCH"); }
export function DELETE() { return methodNotAllowed("PATCH"); }
