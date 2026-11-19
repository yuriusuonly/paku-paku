import { customerAuthorizationInterceptor } from "../../interceptors/customer-authorization.interceptor.js";
import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { createCheckoutOrder } from "../../repositories/order.repository.js";
import { checkoutSchema } from "../../domain/orders/schema.js";
import { parseWithSchema, requireObjectBody } from "../../shared/validation/request.js";

/**
 * Customer kiosk checkout endpoint.
 * @module endpoints/checkout/index
 */

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  customerAuthorizationInterceptor
)(
  async (context) => {
    const body = requireObjectBody(
      await readJsonBody(context.request),
      "Expected a JSON object with order items."
    );
    const input = parseWithSchema(checkoutSchema, body, {
      code: "invalid_checkout",
      message: "Invalid order."
    });
    return jsonResponse(
      await createCheckoutOrder(context.locals.auth.database, {
        ...input,
        customer_id: context.locals.auth.profile.id
      }),
      { status: 201 }
    );
  }
);

export function GET() { return methodNotAllowed("POST"); }
export function PUT() { return methodNotAllowed("POST"); }
export function PATCH() { return methodNotAllowed("POST"); }
export function DELETE() { return methodNotAllowed("POST"); }
