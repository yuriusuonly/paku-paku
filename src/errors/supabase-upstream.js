/**
 * Supabase upstream error type.
 * @module errors/supabase-upstream
 */

/**
 * Error thrown when a Supabase upstream request or database operation fails.
 */
export class SupabaseUpstreamError extends Error {
  /**
   * @param {string} code - Error code.
   * @param {string} message - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(code, message, cause) {
    super(message);
    this.name = "SupabaseUpstreamError";
    this.status = 502;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {SupabaseUpstreamError}
 */
export function supabaseUpstream(code, message, cause) {
  return new SupabaseUpstreamError(code, message, cause);
}
