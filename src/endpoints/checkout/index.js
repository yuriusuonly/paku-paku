import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { createCheckoutTransaction } from "../../repositories/transaction.repository.js";
import { checkoutSchema } from "../../domain/transactions/schema.js";
import { parseWithSchema, requireObjectBody } from "../../shared/validation/request.js";

/**
 * Public kiosk checkout endpoint.
 * @module endpoints/checkout/index
 */

export const POST = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("POST"))(
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
      await createCheckoutTransaction(undefined, input),
      { status: 201 }
    );
  }
);

export function GET() { return methodNotAllowed("POST"); }
export function PUT() { return methodNotAllowed("POST"); }
export function PATCH() { return methodNotAllowed("POST"); }
export function DELETE() { return methodNotAllowed("POST"); }
