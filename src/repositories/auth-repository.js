import { getBearerToken } from "../network/request.js";
import { badGateway } from "../errors/bad-gateway.js";
import { badRequest } from "../errors/bad-request.js";
import { forbidden } from "../errors/forbidden.js";
import { serviceUnavailable } from "../errors/service-unavailable.js";
import { tooManyRequests } from "../errors/too-many-requests.js";
import { unauthorized } from "../errors/unauthorized.js";
import {
  createSupabaseServerClient,
  getSupabaseServerConfig
} from "../shared/supabase.js";
import { findProfileByUserId, toPublicProfile } from "./profile-repository.js";

/**
 * Authentication data access and orchestration (API to auth/database contracts).
 * @module repositories/auth-repository
 */

/**
 * Signs in with validated credentials and returns session tokens with profile.
 *
 * @param {{email: string, password: string}} credentials - Validated credentials.
 * @returns {Promise<{user: object, session: object}>} Session payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function signIn({ email, password }) {
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
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
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
 * @returns {Promise<{token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object}>} Admin auth context.
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
 * Registers a new customer account and creates its profile.
 *
 * @param {{username: string, email: string, password: string}} input - Registration payload.
 * @returns {Promise<{user: object, session: object | null}>} Registration result.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function register({ username, email, password }) {
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error || !data.user) {
    const message = (error?.message || "").toLowerCase();
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many registration attempts. Try again later.");
    }
    if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
      throw badRequest("username_taken", "That username is already taken.");
    }
    throw badGateway("registration_failed", "Could not create the account.", error);
  }

  // If email confirmations are enabled, no session is returned; profile creation requires an authenticated session.
  if (!data.session) {
    return {
      user: { id: data.user.id, username, role: "customer" },
      session: null
    };
  }

  const authenticated = createSupabaseServerClient({ accessToken: data.session.access_token });
  const { data: profile, error: profileError } = await authenticated
    .from("profiles")
    .insert({ id: data.user.id, username, role: "customer" })
    .select("id, username, role, created_at, updated_at")
    .single();

  if (profileError || !profile) {
    throw badGateway("profile_create_failed", "Account was created but the profile could not be saved.", profileError);
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
    if (error && error.isAppError) {
      throw error;
    }
    throw badGateway("sign_out_failed", "Could not revoke the session.", error);
  }
}
