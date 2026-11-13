import { createSupabaseServerClient } from "../../shared/supabase-server.js";

/**
 * Profile service: domain rules and data access for app profiles.
 * @module services/profile-service
 */

/**
 * Columns selected for profile payloads. Internal Auth emails are excluded.
 *
 * @type {string}
 */
export const PROFILE_COLUMNS = "id, username, role, created_at, updated_at";

/**
 * Allowed username shape: lowercase letters, digits, dots, underscores, and
 * hyphens, starting with a letter or digit (3–32 characters).
 *
 * @type {RegExp}
 */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

/**
 * Internal email domain for username-based accounts.
 *
 * @type {string}
 */
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

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
 * Shapes a profile row into the public API payload.
 *
 * @param {{id: string, username: string, role: string, created_at: string, updated_at?: string}} profile - Profile row.
 * @returns {{id: string, username: string, role: string, created_at: string, updated_at?: string}} Public profile payload.
 */
export function toPublicProfile(profile) {
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

/**
 * Loads a profile by user id using the provided authenticated client.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase - Request-scoped Supabase client.
 * @param {string} userId - Auth user id.
 * @returns {Promise<{profile?: object, error?: {status: number, code: string, message: string}}>} Profile result.
 */
export async function getProfileByUserId(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      error: {
        status: 500,
        code: "profile_unavailable",
        message: "Could not load the account profile."
      }
    };
  }

  if (!profile) {
    return {
      error: {
        status: 403,
        code: "profile_missing",
        message: "This account has no profile."
      }
    };
  }

  return { profile };
}

/**
 * Lists all profiles for an authenticated admin request.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase - Admin-scoped Supabase client.
 * @returns {Promise<{profiles?: object[], error?: {status: number, code: string, message: string}}>} Profiles result.
 */
export async function listProfiles(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("username", { ascending: true });

  if (error) {
    return {
      error: {
        status: 502,
        code: "profiles_unavailable",
        message: "Could not load profiles."
      }
    };
  }

  return {
    ok: true,
    data: {
      profiles: data.map(toPublicProfile)
    }
  };
}
