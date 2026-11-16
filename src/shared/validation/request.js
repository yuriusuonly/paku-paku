import { badRequest } from "../errors/bad-request.js";

/**
 * Request body, field, and route parameter validation helpers.
 * @module shared/validation/request
 */

/**
 * Requires a parsed JSON object body.
 *
 * @param {unknown} body
 * @param {string} [message]
 * @returns {Record<string, any>}
 */
export function requireObjectBody(body, message = "Expected a JSON object.") {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("invalid_body", message);
  }
  return body;
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
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) {
    throw badRequest(code, message);
  }
  return result;
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
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw badRequest(code, message);
  }
  return value.trim() || null;
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
  if ((value == null || value === "") && defaultValue !== undefined) {
    return defaultValue;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || (typeof min === "number" && number < min)) {
    throw badRequest(code, message);
  }
  return number;
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
  if (typeof value !== "boolean") {
    throw badRequest(code, message);
  }
  return value;
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
