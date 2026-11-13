import { errorResponse, getBearerToken } from "./api.js";
import { createSupabaseServerClient } from "./supabase-server.js";

/**
 * Authentication and authorization helpers shared by API routes.
 *
 * Usernames are the public login identifier. The corresponding Supabase Auth
 * email is internal and derived as `<username>@paku-paku.local`; the Auth email
 * is never returned to clients.
 *
 * @module shared/api-auth
 */

/**
 * Internal email domain for username-based accounts.
 *
 * @type {string}
 */
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

/**
 * Allowed username shape: lowercase letters, digits, dots, underscores, and
 * hyphens, starting with a letter or digit (3–32 characters).
 *
 * @type {RegExp}
 */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

/**
 * Columns returned for a profile. Auth emails live in `auth.users` and are
 * intentionally excluded.
 *
 * @type {string}
 */
export const PROFILE_COLUMNS = "id, username, role, created_at, updated_at";

/**
 * Normalizes a username for lookup and validation.
 *
 * @param {unknown} value - Raw username input.
 * @returns {string} Trimmed lowercase username, or an empty string when the input is not a string.
 */
export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Derives the internal Supabase Auth email for a username.
 *
 * @param {string} username - Normalized username.
 * @returns {string} Internal Auth email.
 */
export function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

/**
 * Shapes a profile for API responses.
 *
 * @param {{id: string, username: string, role: string, created_at: string, updated_at?: string}} profile - Profile row.
 * @returns {{id: string, username: string, role: string, created_at: string, updated_at?: string}} Public profile payload.
 */
export function publicProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

/**
 * Verifies the request's bearer token and loads the caller's profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{error?: Response, token?: string, supabase?: import("@supabase/supabase-js").SupabaseClient, user?: import("@supabase/supabase-js").User, profile?: {id: string, username: string, role: string, created_at: string, updated_at?: string}}>} Authenticated context, or an error response.
 */
export async function authenticateRequest(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      error: errorResponse(401, "unauthorized", "Missing bearer token.")
    };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient({ accessToken: token });
  } catch {
    return {
      error: errorResponse(503, "supabase_unconfigured", "Supabase is not configured for server routes.")
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      error: errorResponse(401, "unauthorized", "Invalid or expired session.")
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    return {
      error: errorResponse(500, "profile_unavailable", "Could not load the account profile.")
    };
  }

  if (!profile) {
    return {
      error: errorResponse(403, "profile_missing", "This account has no profile.")
    };
  }

  return {
    token,
    supabase,
    user: userData.user,
    profile
  };
}

/**
 * Verifies the request's bearer token and requires an admin profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{error?: Response, token?: string, supabase?: import("@supabase/supabase-js").SupabaseClient, user?: import("@supabase/supabase-js").User, profile?: {id: string, username: string, role: string, created_at: string, updated_at?: string}}>} Admin context, or an error response.
 */
export async function authenticateAdmin(request) {
  const auth = await authenticateRequest(request);

  if (auth.error) {
    return auth;
  }

  if (auth.profile.role !== "admin") {
    return {
      error: errorResponse(403, "forbidden", "Administrator access required.")
    };
  }

  return auth;
}
