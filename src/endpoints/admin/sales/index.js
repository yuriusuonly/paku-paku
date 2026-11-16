import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { badRequest } from "../../../shared/errors/bad-request.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { HTTP_STATUS } from "../../../shared/constants/http.js";
import { createSale, listSales } from "../../../repositories/sales-repository.js";

/**
 * Composed admin sales collection endpoint handlers.
 * @module endpoints/admin/sales/index
 */

const SALE_STATUSES = new Set(["completed", "pending", "cancelled"]);

function normalizeSaleItem(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw badRequest("invalid_sale", `Sale item ${index + 1} is invalid.`);
  }
  const itemName = typeof item.item_name === "string" ? item.item_name.trim() : "";
  if (!itemName) throw badRequest("invalid_sale", `Sale item ${index + 1} name is required.`);

  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw badRequest("invalid_sale", `Sale item ${index + 1} quantity must be a positive integer.`);
  }

  const unitPrice = Number(item.unit_price_cents ?? 0);
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    throw badRequest("invalid_sale", `Sale item ${index + 1} unit price must be a non-negative integer.`);
  }

  const lineTotal = Number(item.line_total_cents ?? unitPrice * quantity);
  if (!Number.isInteger(lineTotal) || lineTotal < 0) {
    throw badRequest("invalid_sale", `Sale item ${index + 1} line total must be a non-negative integer.`);
  }

  return {
    item_name: itemName,
    quantity,
    unit_price_cents: unitPrice,
    line_total_cents: lineTotal,
    menu_item_id: typeof item.menu_item_id === "string" && item.menu_item_id.trim() ? item.menu_item_id.trim() : null,
    inventory_item_id:
      typeof item.inventory_item_id === "string" && item.inventory_item_id.trim() ? item.inventory_item_id.trim() : null
  };
}

function normalizeSaleInput(body, { partial }) {
  const input = {};

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = typeof body.status === "string" ? body.status.trim() : "";
    if (!SALE_STATUSES.has(status)) {
      throw badRequest("invalid_sale", "Sale status must be completed, pending, or cancelled.");
    }
    input.status = status;
  } else if (!partial) {
    input.status = "completed";
  }

  if (Object.prototype.hasOwnProperty.call(body, "payment_method")) {
    input.payment_method =
      body.payment_method == null || body.payment_method === ""
        ? null
        : typeof body.payment_method === "string"
          ? body.payment_method.trim() || null
          : (() => { throw badRequest("invalid_sale", "Sale payment method must be a string."); })();
  } else if (!partial) {
    input.payment_method = null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "customer_name")) {
    input.customer_name =
      body.customer_name == null || body.customer_name === ""
        ? null
        : typeof body.customer_name === "string"
          ? body.customer_name.trim() || null
          : (() => { throw badRequest("invalid_sale", "Sale customer name must be a string."); })();
  } else if (!partial) {
    input.customer_name = null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "notes")) {
    input.notes =
      body.notes == null || body.notes === ""
        ? null
        : typeof body.notes === "string"
          ? body.notes.trim() || null
          : (() => { throw badRequest("invalid_sale", "Sale notes must be a string."); })();
  } else if (!partial) {
    input.notes = null;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "items")) {
    const rawItems = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      if (partial && !Object.prototype.hasOwnProperty.call(body, "items")) {
        // no items update
      } else {
        throw badRequest("invalid_sale", "Sale must include at least one item.");
      }
    } else {
      input.items = rawItems.map(normalizeSaleItem);
      const subtotal = input.items.reduce((sum, item) => sum + item.line_total_cents, 0);
      input.subtotal_cents = subtotal;
      input.total_cents = subtotal;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "subtotal_cents") && input.subtotal_cents == null) {
    const subtotal = Number(body.subtotal_cents);
    if (!Number.isInteger(subtotal) || subtotal < 0) {
      throw badRequest("invalid_sale", "Sale subtotal must be a non-negative integer.");
    }
    input.subtotal_cents = subtotal;
  }
  if (Object.prototype.hasOwnProperty.call(body, "total_cents") && input.total_cents == null) {
    const total = Number(body.total_cents);
    if (!Number.isInteger(total) || total < 0) {
      throw badRequest("invalid_sale", "Sale total must be a non-negative integer.");
    }
    input.total_cents = total;
  }

  if (!partial && input.subtotal_cents == null) input.subtotal_cents = 0;
  if (!partial && input.total_cents == null) input.total_cents = input.subtotal_cents ?? 0;

  if (partial && Object.keys(input).length === 0) {
    throw badRequest("invalid_sale", "No sale fields to update.");
  }

  return input;
}

async function parseCreateRequest(request) {
  const body = await readJsonBody(request);
  if (!body) throw badRequest("invalid_body", "Expected a JSON object with sale fields.");
  return normalizeSaleInput(body, { partial: false });
}

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => jsonResponse(await listSales(context.locals.auth.database)));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateRequest(context.request);
  return jsonResponse(
    await createSale(context.locals.auth.database, input, { userId: context.locals.auth.profile?.id || context.locals.auth.user?.id || null }),
    { status: HTTP_STATUS.CREATED }
  );
});

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
