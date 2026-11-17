import { getBearerToken } from "../shared/network/request.js";
import { badRequest } from "../shared/errors/bad-request.js";
import { forbidden } from "../shared/errors/forbidden.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { tooManyRequests } from "../shared/errors/too-many-requests.js";
import { unauthorized } from "../shared/errors/unauthorized.js";
import { generateToken } from "../shared/cipher/token.js";
import {
  createDatabaseClient,
  getDatabaseServerConfig
} from "../database/instance.js";
import { findProfileByUserId, toPublicProfile } from "./profile.repository.js";

function createRecoveryCode() {
  const raw = generateToken(12).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 16);
  const code = (raw + generateToken(8).replace(/[^a-zA-Z0-9]/g, "").toUpperCase()).slice(0, 16);
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}-${code.slice(12, 16)}`;
}

async function hashRecoveryCode(database, code) {
  const { data, error } = await database.rpc("hash_recovery_code", { p_code: code });
  if (error || typeof data !== "string") {
    throw databaseUpstream("recovery_code_failed", "Could not create a recovery code.", error);
  }
  return data;
}

/**
 * Authentication data access and orchestration (API to auth/database contracts).
 * @module repositories/auth.repository
 */

/**
 * Signs in with validated credentials and returns session tokens with profile.
 *
 * @param {{email: string, password: string}} credentials - Validated credentials.
 * @returns {Promise<{user: object, session: object}>} Session payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function signIn({ email, password }) {
  let database;
  try {
    database = createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  const { data, error } = await database.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many sign-in attempts. Try again later.");
    }
    throw unauthorized("invalid_credentials", "Invalid email or password.");
  }

  const authenticated = createDatabaseClient({
    accessToken: data.session.access_token
  });
  const profile = await findProfileByUserId(authenticated, data.user.id);

  return {
    user: toPublicProfile(profile),
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type
    }
  };
}

/**
 * Authenticates a request and resolves auth context.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{token: string, database: import("../database/instance.js").DatabaseClient, user: object, profile: object}>} Auth context.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function authenticate(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw unauthorized("unauthorized", "Missing bearer token.");
  }

  let database;
  try {
    database = createDatabaseClient({ accessToken: token });
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  const { data: userData, error: userError } = await database.auth.getUser(token);

  if (userError || !userData.user) {
    throw unauthorized("unauthorized", "Invalid or expired session.");
  }

  const profile = await findProfileByUserId(database, userData.user.id);

  return {
    token,
    database,
    user: userData.user,
    profile
  };
}

/**
 * Returns the current session profile.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{user: object}>} Session payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function getSession(request) {
  const auth = await authenticate(request);
  return { user: toPublicProfile(auth.profile) };
}

/**
 * Requires an authenticated admin profile.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{token: string, database: import("../database/instance.js").DatabaseClient, user: object, profile: object}>} Admin auth context.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function authenticateAdmin(request) {
  const auth = await authenticate(request);

  if (auth.profile.role !== "admin") {
    throw forbidden("forbidden", "Administrator access required.");
  }

  return auth;
}

/**
 * Signs up a new customer account and creates its profile.
 *
 * @param {{email: string, password: string}} input - Sign-up payload.
 * @returns {Promise<{user: object, session: object | null}>} Sign-up result.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function signUp({ email, password }) {
  let database;
  try {
    database = createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  const { data, error } = await database.auth.signUp({
    email,
    password,
    options: {
      data: { email }
    }
  });

  if (error || !data.user) {
    const message = (error?.message || "").toLowerCase();
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many sign-up attempts. Try again later.");
    }
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      throw badRequest("email_taken", "That email is already taken.");
    }
    throw databaseUpstream("signup_failed", "Could not create the account.", error);
  }

  // If email confirmations are enabled, no session is returned; profile creation requires an authenticated session.
  if (!data.session) {
    return {
      user: { id: data.user.id, email, role: "customer", is_active: true },
      session: null
    };
  }

  const authenticated = createDatabaseClient({ accessToken: data.session.access_token });
  const recoveryCode = createRecoveryCode();
  const recoveryCodeHash = await hashRecoveryCode(authenticated, recoveryCode);
  const { data: profile, error: profileError } = await authenticated
    .from("profiles")
    .insert({ id: data.user.id, email, role: "customer", is_active: true, recovery_code_hash: recoveryCodeHash })
    .select("id, email, role, is_active, created_at, updated_at")
    .single();

  if (profileError || !profile) {
    throw databaseUpstream("profile_create_failed", "Account was created but the profile could not be saved.", profileError);
  }

  return {
    user: toPublicProfile(profile),
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type
    },
    recovery_code: recoveryCode
  };
}

/**
 * Creates a customer account and profile as an administrator.
 *
 * @param {import("../database/instance.js").DatabaseClient} adminDatabase - Admin-scoped database client.
 * @param {{email: string, password: string}} input - User payload.
 * @returns {Promise<{profile: object}>} Created profile payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function createManagedUser(adminDatabase, { email, password }) {
  let database;
  try {
    database = createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  const { data, error } = await database.auth.signUp({
    email,
    password,
    options: {
      data: { email }
    }
  });

  if (error || !data.user) {
    const message = (error?.message || "").toLowerCase();
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many sign-up attempts. Try again later.");
    }
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      throw badRequest("email_taken", "That email is already taken.");
    }
    throw databaseUpstream("signup_failed", "Could not create the account.", error);
  }

  const recoveryCode = createRecoveryCode();
  const recoveryCodeHash = await hashRecoveryCode(adminDatabase, recoveryCode);
  const { data: profile, error: profileError } = await adminDatabase
    .from("profiles")
    .insert({ id: data.user.id, email, role: "customer", is_active: true, recovery_code_hash: recoveryCodeHash })
    .select("id, email, role, is_active, created_at, updated_at")
    .single();

  if (profileError || !profile) {
    // Profile insert may fail if another process created it; try to read existing.
    const { data: existing } = await adminDatabase
      .from("profiles")
      .select("id, email, role, is_active, created_at, updated_at")
      .eq("id", data.user.id)
      .maybeSingle();

    if (existing) {
      return { profile: toPublicProfile(existing), recovery_code: recoveryCode };
    }

    throw databaseUpstream("profile_create_failed", "Account was created but the profile could not be saved.", profileError);
  }

  return { profile: toPublicProfile(profile), recovery_code: recoveryCode };
}

/**
 * Recovers an account password using a one-time recovery code.
 *
 * @param {{email: string, recovery_code: string, new_password: string}} input - Recovery payload.
 * @returns {Promise<{ok: boolean}>} Recovery result.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function recoverAccount({ email, recovery_code, new_password }) {
  let database;
  try {
    database = createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  const { error } = await database.rpc("recover_account", {
    p_email: email,
    p_recovery_code: recovery_code,
    p_new_password: new_password
  });

  if (error) {
    const message = String(error.message || "");
    if (message.includes("invalid_recovery_code")) {
      throw badRequest("invalid_recovery_code", "Invalid email or recovery code.");
    }
    if (message.includes("invalid_password")) {
      throw badRequest("invalid_password", "Password must be at least 6 characters.");
    }
    throw databaseUpstream("recovery_failed", "Could not recover the account.", error);
  }

  return { ok: true };
}

/**
 * Updates the authenticated user's password.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Request-scoped authenticated database client.
 * @param {string} password - New password.
 * @returns {Promise<{ok: boolean}>} Result.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function updatePassword(database, password) {
  if (typeof password !== "string" || password.length < 6) {
    throw badRequest("invalid_password", "Password must be at least 6 characters.");
  }
  const { error } = await database.auth.updateUser({ password });
  if (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("password")) {
      throw badRequest("invalid_password", "Password must be at least 6 characters.");
    }
    throw databaseUpstream("password_update_failed", "Could not change the password.", error);
  }
  return { ok: true };
}

/**
 * Revokes the caller's session.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<void>} Resolves on success.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function signOut(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw unauthorized("unauthorized", "Missing bearer token.");
  }

  let config;
  try {
    config = getDatabaseServerConfig();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/logout?scope=local`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    });

    if (!response.ok && response.status !== 401) {
      throw databaseUpstream("sign_out_failed", "Could not revoke the session.");
    }
  } catch (error) {
    if (error && error.isAppError) {
      throw error;
    }
    throw databaseUpstream("sign_out_failed", "Could not revoke the session.", error);
  }
}
