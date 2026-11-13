import { supabaseUpstream } from "../errors/supabase-upstream.js";
import { forbidden } from "../errors/forbidden.js";
import { internalError } from "../errors/internal.js";

/**
 * Profile data access (API to database contracts).
 * @module repositories/profile-repository
 */

/**
 * Columns selected for profile payloads.
 *
 * @type {string}
 */
export const PROFILE_COLUMNS = "id, username, role, created_at, updated_at";

/**
 * Shapes a profile row into the public payload.
 *
 * @param {{id: string, username: string, role: string, created_at: string, updated_at?: string}} profile - Profile row.
 * @returns {{id: string, username: string, role: string, created_at: string, updated_at?: string}} Public profile.
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
 * Finds a profile by authenticated user id.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase - Request-scoped client.
 * @param {string} userId - User id.
 * @returns {Promise<object>} Profile row.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On lookup failure.
 */
export async function findProfileByUserId(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw internalError("profile_unavailable", "Could not load the account profile.", error);
  }

  if (!profile) {
    throw forbidden("profile_missing", "This account has no profile.");
  }

  return profile;
}

/**
 * Lists all profiles ordered by username.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase - Admin-scoped client.
 * @returns {Promise<{profiles: object[]}>} Profiles payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On query failure.
 */
export async function listProfiles(supabase) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("username", { ascending: true });

  if (error) {
    throw supabaseUpstream("profiles_unavailable", "Could not load profiles.", error);
  }

  return {
    profiles: data.map(toPublicProfile)
  };
}
