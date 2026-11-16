import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { getInvoiceById } from "../../repositories/invoice-repository.js";

/**
 * Customer invoice endpoint handlers (by id).
 * @module endpoints/invoices/[id]
 */

function getId(context) {
  const id = context?.params?.id || (context?.url?.pathname || "").split("/").filter(Boolean).pop();
  return typeof id === "string" ? id.trim() : "";
}

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await getInvoiceById(context.locals.auth.database, getId(context)))
);

export function POST() { return methodNotAllowed("GET"); }
export function PUT() { return methodNotAllowed("GET"); }
export function PATCH() { return methodNotAllowed("GET"); }
export function DELETE() { return methodNotAllowed("GET"); }
