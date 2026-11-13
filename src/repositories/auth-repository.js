import { getBearerToken } from "../requests/index.js";
import { parseSignInCredentials } from "../requests/auth-request.js";
import {
  AppError,
  badGateway,
  forbidden,
  serviceUnavailable,
  tooManyRequests,
  unauthorized
} from "../shared/errors.js";
import {
  createSupabaseServerClient,
  getSupabaseServerConfig
} from "../shared/supabase-server.js";
import { findProfileByUserId, toPublicProfile } from "./profile-repository.js";

/**
 * Authentication data access and orchestration (API to auth/database contracts).
 * @module repositories/auth-repository
 */

/**
 * Signs in with credentials and returns session tokens with profile.
 *
 * @param {Record<string, unknown>} body - Request body.
 * @returns {Promise<{user: object, session: object}>} Session payload.
 * @throws {import("../shared/errors.js").AppError} On failure.
 */
export async function signIn(body = {}) {
  const { email, password } = parseSignInCredentials(body);

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch (error) {
    throw serviceUnavailable(
      "supabase_unconfigured",
      "Supabase is not configured for server routes.",
      error
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many sign-in attempts. Try again later.");
    }
    throw unauthorized("invalid_credentials", "Invalid username or password.");
  }

  const authenticated = createSupabaseServerClient({
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
 * @returns {Promise<{token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object}>} Auth context.
 * @throws {import("../shared/errors.js").AppError} On failure.
 */
export async function authenticate(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw unauthorized("unauthorized", "Missing bearer token.");
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient({ accessToken: token });
  } catch (error) {
    throw serviceUnavailable(
      "supabase_unconfigured",
      "Supabase is not configured for server routes.",
      error
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    throw unauthorized("unauthorized", "Invalid or expired session.");
  }

  const profile = await findProfileByUserId(supabase, userData.user.id);

  return {
    token,
    supabase,
    user: userData.user,
    profile
  };
}

/**
 * Returns the current session profile.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{user: object}>} Session payload.
 * @throws {import("../shared/errors.js").AppError} On failure.
 */
export async function getSession(request) {
  const auth = await authenticate(request);
  return { user: toPublicProfile(auth.profile) };
}

/**
 * Requires an authenticated admin profile.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object}>} Admin auth context.
 * @throws {import("../shared/errors.js").AppError} On failure.
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
 * @throws {import("../shared/errors.js").AppError} On failure.
 */
export async function signOut(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw unauthorized("unauthorized", "Missing bearer token.");
  }

  let config;
  try {
    config = getSupabaseServerConfig();
  } catch (error) {
    throw serviceUnavailable(
      "supabase_unconfigured",
      "Supabase is not configured for server routes.",
      error
    );
  }

  try {
    const response = await fetch(`${config.url}/auth/v1/logout?scope=global`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: "{}"
    });

    if (!response.ok && response.status !== 401) {
      throw badGateway("sign_out_failed", "Could not revoke the session.");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw badGateway("sign_out_failed", "Could not revoke the session.", error);
  }
}
