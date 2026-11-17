import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { forbidden } from "../shared/errors/forbidden.js";
import { internalError } from "../shared/errors/internal.js";

/**
 * Profile data access (API to database contracts).
 * @module repositories/profile.repository
 */

/**
 * Columns selected for profile payloads.
 *
 * @type {string}
 */
export const PROFILE_COLUMNS = "id, email, role, is_active, full_name, phone, created_at, updated_at";

/**
 * Shapes a profile row into the public payload.
 *
 * @param {{id: string, email: string, role: string, is_active?: boolean, full_name?: string | null, phone?: string | null, created_at: string, updated_at?: string}} profile - Profile row.
 * @returns {{id: string, email: string, role: string, is_active: boolean, full_name: string | null, phone: string | null, created_at: string, updated_at?: string}} Public profile.
 */
export function toPublicProfile(profile) {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    is_active: profile.is_active !== false,
    full_name: profile.full_name ?? null,
    phone: profile.phone ?? null,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

/**
 * Finds a profile by authenticated user id.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Request-scoped database client.
 * @param {string} userId - User id.
 * @returns {Promise<object>} Profile row.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On lookup failure.
 */
export async function findProfileByUserId(database, userId) {
  const { data: profile, error } = await database
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

  if (profile.is_active === false) {
    throw forbidden("profile_inactive", "This account is inactive.");
  }

  return profile;
}

/**
 * Lists all profiles ordered by email.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Admin-scoped database client.
 * @returns {Promise<{profiles: object[]}>} Profiles payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On query failure.
 */
export async function listProfiles(database) {
  const { data, error } = await database
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .neq("email", "root@paku-paku.official")
    .order("email", { ascending: true });

  if (error) {
    throw databaseUpstream("profiles_unavailable", "Could not load profiles.", error);
  }

  return {
    profiles: data.map(toPublicProfile)
  };
}

/**
 * Creates a customer profile for an existing auth user (admin only).
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Admin-scoped database client.
 * @param {{id: string, email: string, role?: string, is_active?: boolean}} input - Profile fields.
 * @returns {Promise<{profile: object}>} Created profile payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function createProfile(database, { id, email, role = "customer", is_active = true }) {
  const { data, error } = await database
    .from("profiles")
    .insert({ id, email, role, is_active })
    .select(PROFILE_COLUMNS)
    .single();

  if (error || !data) {
    throw databaseUpstream("profile_create_failed", "Could not create the profile.", error);
  }

  return { profile: toPublicProfile(data) };
}

/**
 * Updates a profile's audit/management fields (admin only).
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Admin-scoped database client.
 * @param {string} id - Profile id.
 * @param {{is_active?: boolean, full_name?: string | null, phone?: string | null}} input - Fields to update.
 * @returns {Promise<{profile: object}>} Updated profile payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function updateProfile(database, id, input) {
  const payload = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(input, "is_active")) {
    payload.is_active = Boolean(input.is_active);
  }
  if (Object.prototype.hasOwnProperty.call(input, "full_name")) {
    payload.full_name = input.full_name == null || input.full_name === "" ? null : String(input.full_name).trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, "phone")) {
    payload.phone = input.phone == null || input.phone === "" ? null : String(input.phone).trim();
  }

  const { data, error } = await database
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error || !data) {
    throw databaseUpstream("profile_update_failed", "Could not update the profile.", error);
  }

  return { profile: toPublicProfile(data) };
}

/**
 * Updates the authenticated customer's own profile fields.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Request-scoped database client.
 * @param {string} id - Profile/user id (must match auth uid by RLS).
 * @param {{full_name?: string | null, phone?: string | null}} input - Profile fields.
 * @returns {Promise<{profile: object}>} Updated profile payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function updateOwnProfile(database, id, input) {
  const payload = { updated_at: new Date().toISOString() };
  if (Object.prototype.hasOwnProperty.call(input, "full_name")) {
    payload.full_name = input.full_name == null || input.full_name === "" ? null : String(input.full_name).trim();
  }
  if (Object.prototype.hasOwnProperty.call(input, "phone")) {
    payload.phone = input.phone == null || input.phone === "" ? null : String(input.phone).trim();
  }

  const { data, error } = await database
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error || !data) {
    throw databaseUpstream("profile_update_failed", "Could not update your profile.", error);
  }

  return { profile: toPublicProfile(data) };
}
