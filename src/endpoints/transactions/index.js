import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { createBuyTransaction, listTransactions } from "../../repositories/transaction-repository.js";

/**
 * Customer transactions endpoint handlers.
 * @module endpoints/transactions/index
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await listTransactions(context.locals.auth.database))
);

export const POST = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("POST"), authenticationInterceptor)(
  async (context) => {
    const body = await readJsonBody(context.request);
    if (!body) {
      throw badRequest("invalid_body", "Expected a JSON object with transaction data.");
    }
    return jsonResponse(
      await createBuyTransaction(context.locals.auth.database, body, {
        customerId: context.locals.auth.user.id,
        profile: context.locals.auth.profile
      }),
      { status: 201 }
    );
  }
);

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
