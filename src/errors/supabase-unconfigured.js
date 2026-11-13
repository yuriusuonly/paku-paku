/**
 * Supabase unconfigured error type.
 * @module errors/supabase-unconfigured
 */

/**
 * Error thrown when Supabase is not configured for the selected environment.
 */
export class SupabaseUnconfiguredError extends Error {
  /**
   * @param {string} [message] - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(message = "Supabase is not configured.", cause) {
    super(message);
    this.name = "SupabaseUnconfiguredError";
    this.status = 503;
    this.code = "supabase_unconfigured";
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} [message] - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {SupabaseUnconfiguredError}
 */
export function supabaseUnconfigured(message = "Supabase is not configured.", cause) {
  return new SupabaseUnconfiguredError(message, cause);
}
