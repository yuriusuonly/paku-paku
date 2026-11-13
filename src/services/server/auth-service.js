import { getBearerToken } from "../../shared/api.js";
import {
  AppError,
  badGateway,
  badRequest,
  forbidden,
  serviceUnavailable,
  tooManyRequests,
  unauthorized
} from "../../shared/errors.js";
import {
  createSupabaseServerClient,
  getSupabaseServerConfig
} from "../../shared/supabase-server.js";
import {
  getProfileByUserId,
  loginEmailForUsername,
  normalizeUsername,
  toPublicProfile,
  USERNAME_PATTERN
} from "./profile-service.js";

/**
 * Authentication service: sign-in, session validation, sign-out, and role checks.
 * @module services/server/auth-service
 */

/**
 * Signs in with username/password and returns session tokens with the profile.
 *
 * @param {object} credentials - Sign-in credentials.
 * @param {unknown} credentials.username - Public username.
 * @param {unknown} credentials.password - Password.
 * @returns {Promise<{user: object, session: object}>} Session payload.
 * @throws {import("../../shared/errors.js").AppError} On validation or authentication failure.
 */
export async function signIn({ username: rawUsername, password: rawPassword } = {}) {
  const username = normalizeUsername(rawUsername);
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    throw badRequest("invalid_credentials", "Enter a valid username and password.");
  }

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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmailForUsername(username),
    password
  });

  if (error || !data.session) {
    if (error?.status === 429) {
      throw tooManyRequests("rate_limited", "Too many sign-in attempts. Try again later.");
    }
    throw unauthorized("invalid_credentials", "Invalid username or password.");
  }

  const authenticated = createSupabaseServerClient({
    accessToken: data.session.access_token
  });
  const profile = await getProfileByUserId(authenticated, data.user.id);

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
 * Authenticates a bearer token and resolves the caller's profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object}>} Auth context.
 * @throws {import("../../shared/errors.js").AppError} On authentication failure.
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

  const profile = await getProfileByUserId(supabase, userData.user.id);

  return {
    token,
    supabase,
    user: userData.user,
    profile
  };
}

/**
 * Returns the current session profile for a bearer-authenticated request.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{user: object}>} Session payload.
 * @throws {import("../../shared/errors.js").AppError} On authentication failure.
 */
export async function getSession(request) {
  const auth = await authenticate(request);
  return {
    user: toPublicProfile(auth.profile)
  };
}

/**
 * Requires an authenticated admin profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object}>} Admin auth context.
 * @throws {import("../../shared/errors.js").AppError} On authentication/authorization failure.
 */
export async function authenticateAdmin(request) {
  const auth = await authenticate(request);

  if (auth.profile.role !== "admin") {
    throw forbidden("forbidden", "Administrator access required.");
  }

  return auth;
}

/**
 * Revokes the caller's session in GoTrue.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<void>} Resolves when sign-out completes.
 * @throws {import("../../shared/errors.js").AppError} On sign-out failure.
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
