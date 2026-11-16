import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { listTransactions } from "../../repositories/transaction-repository.js";

/**
 * Customer transactions endpoint handlers.
 * @module endpoints/transactions/index
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await listTransactions(context.locals.auth.database))
);

export function POST() { return methodNotAllowed("GET"); }
export function PUT() { return methodNotAllowed("GET"); }
export function PATCH() { return methodNotAllowed("GET"); }
export function DELETE() { return methodNotAllowed("GET"); }
