import { getBearerToken } from "../shared/network/request.js";
import { forbidden } from "../shared/errors/forbidden.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { tooManyRequests } from "../shared/errors/too-many-requests.js";
import { unauthorized } from "../shared/errors/unauthorized.js";
import {
  createDatabaseClient,
  getDatabaseServerConfig
} from "../database/instance.js";
import { findProfileByUserId, toPublicProfile } from "./profile.repository.js";

/**
 * Administrator authentication data access and orchestration.
 * Customer/kiosk visitors do not have accounts; only staff sign in.
 * @module repositories/auth.repository
 */

/**
 * Signs in an administrator and returns session tokens with profile.
 *
 * @param {{email: string, password: string}} credentials - Validated credentials.
 * @returns {Promise<{user: object, session: object}>} Session payload.
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

  const authenticated = createDatabaseClient({ accessToken: data.session.access_token });
  const profile = await findProfileByUserId(authenticated, data.user.id);

  if (profile.role !== "admin") {
    throw forbidden("forbidden", "Administrator access required.");
  }

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
 * @returns {Promise<{token: string, database: object, user: object, profile: object}>} Auth context.
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

  return { token, database, user: userData.user, profile };
}

/**
 * Returns the current session profile.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{user: object}>} Session payload.
 */
export async function getSession(request) {
  const auth = await authenticate(request);
  return { user: toPublicProfile(auth.profile) };
}

/**
 * Requires an authenticated administrator.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{token: string, database: object, user: object, profile: object}>} Admin auth context.
 */
export async function authenticateAdmin(request) {
  const auth = await authenticate(request);

  if (auth.profile.role !== "admin") {
    throw forbidden("forbidden", "Administrator access required.");
  }

  return auth;
}

/**
 * Revokes the caller's session.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<void>} Resolves on success.
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
