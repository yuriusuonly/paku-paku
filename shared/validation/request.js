import { z } from "zod";
import { badRequest } from "../errors/bad-request.js";

/**
 * Zod-backed request body, field, and route parameter validation helpers.
 * @module shared/validation/request
 */

/**
 * Parses a value with a Zod schema, throwing a typed bad request error on failure.
 *
 * @template T
 * @param {import("zod").ZodType<T>} schema
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {T}
 */
export function parseWithSchema(schema, value, {
  code = "invalid_request",
  message
} = {}) {
  const result = schema.safeParse(value);
  if (result.success) {
    return result.data;
  }
  const issueMessage = result.error.issues.map((issue) => issue.message).join(" ");
  throw badRequest(code, message || issueMessage || "Invalid request.");
}

/**
 * Requires a parsed JSON object body.
 *
 * @param {unknown} body
 * @param {string} [message]
 * @returns {Record<string, any>}
 */
export function requireObjectBody(body, message = "Expected a JSON object.") {
  return parseWithSchema(z.record(z.string(), z.unknown()), body, {
    code: "invalid_body",
    message
  });
}

/**
 * Checks whether an object owns a field.
 * @param {Record<string, any>} body
 * @param {string} key
 * @returns {boolean}
 */
export function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

/**
 * Requires a non-empty trimmed string.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {string}
 */
export function requireString(value, {
  code = "invalid_request",
  message = "A value is required."
} = {}) {
  return parseWithSchema(z.string().trim().min(1), value, { code, message });
}

/**
 * Reads an optional string field, returning `null` for empty values.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {string | null}
 */
export function readNullableString(value, {
  code = "invalid_request",
  message = "Must be a string."
} = {}) {
  const schema = z.preprocess(
    (input) => (typeof input === "string" && input.trim() === "" ? null : input),
    z.string().trim().nullable()
  );
  return parseWithSchema(schema, value, { code, message });
}

/**
 * Requires an integer within optional bounds.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string, min?: number, defaultValue?: number}} [options]
 * @returns {number}
 */
export function readInteger(value, {
  code = "invalid_request",
  message = "Must be an integer.",
  min,
  defaultValue
} = {}) {
  let schema = z.preprocess(
    (input) => ((input == null || input === "") && defaultValue !== undefined ? defaultValue : input),
    z.coerce.number().int()
  );

  if (typeof min === "number") {
    schema = schema.pipe(z.number().min(min));
  }

  return parseWithSchema(schema, value, { code, message });
}

/**
 * Requires a boolean value.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {boolean}
 */
export function readBoolean(value, {
  code = "invalid_request",
  message = "Must be a boolean."
} = {}) {
  return parseWithSchema(z.boolean(), value, { code, message });
}

/**
 * Requires a record id from a route context.
 *
 * @param {object} context
 * @param {{code?: string, message?: string}} [options]
 * @returns {string}
 */
export function readRouteId(context, {
  code = "invalid_id",
  message = "A record id is required."
} = {}) {
  const fromParams = context?.params?.id;
  const fromPath = (context?.url?.pathname || "").split("/").filter(Boolean).pop();
  const value = typeof fromParams === "string" && fromParams.trim()
    ? fromParams
    : typeof fromPath === "string"
      ? fromPath
      : "";
  return requireString(value, { code, message });
}

/**
 * Ensures a partial update contains at least one field.
 *
 * @param {Record<string, any>} input
 * @param {{code?: string, message?: string}} [options]
 * @returns {void}
 */
export function requireUpdateFields(input, {
  code = "invalid_request",
  message = "No fields to update."
} = {}) {
  if (Object.keys(input).length === 0) {
    throw badRequest(code, message);
  }
}
