import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { listInvoices } from "../../repositories/invoice-repository.js";

/**
 * Customer invoices endpoint handlers.
 * @module endpoints/invoices/index
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await listInvoices(context.locals.auth.database))
);

export function POST() { return methodNotAllowed("GET"); }
export function PUT() { return methodNotAllowed("GET"); }
export function PATCH() { return methodNotAllowed("GET"); }
export function DELETE() { return methodNotAllowed("GET"); }
