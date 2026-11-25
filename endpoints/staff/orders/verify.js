import { z } from "zod";
import { staffAuthorizationInterceptor } from "../../../interceptors/staff-authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { readJsonBody } from "../../../network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../network/response.js";
import { parseWithSchema, requireObjectBody } from "../../../validation/request.js";
import { getOrderByReference } from "../../../repositories/order.repository.js";

/**
 * Staff counter order verification endpoint.
 * @module endpoints/staff/orders/verify
 */

const bodySchema = z.object({
  reference: z.string().trim().min(1)
});

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  staffAuthorizationInterceptor
)(async (context) => {
  const body = requireObjectBody(
    await readJsonBody(context.request),
    "Expected a JSON object with an order reference."
  );
  const input = parseWithSchema(bodySchema, body, {
    code: "invalid_order_reference",
    message: "Enter a valid order reference."
  });
  return jsonResponse(await getOrderByReference(context.locals.auth.database, input.reference));
});

export function GET() { return methodNotAllowed("POST"); }
export function PUT() { return methodNotAllowed("POST"); }
export function PATCH() { return methodNotAllowed("POST"); }
export function DELETE() { return methodNotAllowed("POST"); }
