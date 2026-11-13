import { getBearerToken } from "../shared/api.js";
import {
  createSupabaseServerClient,
  getSupabaseServerConfig
} from "../shared/supabase-server.js";
import {
  getProfileByUserId,
  loginEmailForUsername,
  normalizeUsername,
  toPublicProfile,
  USERNAME_PATTERN
} from "./profile-service.js";

/**
 * Authentication service: sign-in, session validation, sign-out, and role checks.
 * @module services/auth-service
 */

/**
 * Signs in with username/password and returns session tokens with the profile.
 *
 * @param {object} credentials - Sign-in credentials.
 * @param {unknown} credentials.username - Public username.
 * @param {unknown} credentials.password - Password.
 * @returns {Promise<{ok: true, data: object} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function signIn({ username: rawUsername, password: rawPassword }) {
  const username = normalizeUsername(rawUsername);
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    return {
      ok: false,
      status: 400,
      code: "invalid_credentials",
      message: "Enter a valid username and password."
    };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return {
      ok: false,
      status: 503,
      code: "supabase_unconfigured",
      message: "Supabase is not configured for server routes."
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmailForUsername(username),
    password
  });

  if (error || !data.session) {
    if (error?.status === 429) {
      return {
        ok: false,
        status: 429,
        code: "rate_limited",
        message: "Too many sign-in attempts. Try again later."
      };
    }

    return {
      ok: false,
      status: 401,
      code: "invalid_credentials",
      message: "Invalid username or password."
    };
  }

  const authenticated = createSupabaseServerClient({
    accessToken: data.session.access_token
  });
  const profileResult = await getProfileByUserId(authenticated, data.user.id);

  if (profileResult.error) {
    return { ok: false, ...profileResult.error };
  }

  return {
    ok: true,
    data: {
      user: toPublicProfile(profileResult.profile),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
        token_type: data.session.token_type
      }
    }
  };
}

/**
 * Authenticates a bearer token and resolves the caller's profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{ok: true, token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function authenticate(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Missing bearer token."
    };
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient({ accessToken: token });
  } catch {
    return {
      ok: false,
      status: 503,
      code: "supabase_unconfigured",
      message: "Supabase is not configured for server routes."
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Invalid or expired session."
    };
  }

  const profileResult = await getProfileByUserId(supabase, userData.user.id);

  if (profileResult.error) {
    return { ok: false, ...profileResult.error };
  }

  return {
    ok: true,
    token,
    supabase,
    user: userData.user,
    profile: profileResult.profile
  };
}

/**
 * Returns the current session profile for a bearer-authenticated request.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{ok: true, data: {user: object}} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function getSession(request) {
  const auth = await authenticate(request);

  if (!auth.ok) {
    return auth;
  }

  return {
    ok: true,
    data: {
      user: toPublicProfile(auth.profile)
    }
  };
}

/**
 * Requires an authenticated admin profile.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{ok: true, token: string, supabase: import("@supabase/supabase-js").SupabaseClient, user: import("@supabase/supabase-js").User, profile: object} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function authenticateAdmin(request) {
  const auth = await authenticate(request);

  if (!auth.ok) {
    return auth;
  }

  if (auth.profile.role !== "admin") {
    return {
      ok: false,
      status: 403,
      code: "forbidden",
      message: "Administrator access required."
    };
  }

  return auth;
}

/**
 * Revokes the caller's session in GoTrue.
 *
 * @param {Request} request - Incoming web request.
 * @returns {Promise<{ok: true, status: 204} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function signOut(request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Missing bearer token."
    };
  }

  let config;
  try {
    config = getSupabaseServerConfig();
  } catch {
    return {
      ok: false,
      status: 503,
      code: "supabase_unconfigured",
      message: "Supabase is not configured for server routes."
    };
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
      return {
        ok: false,
        status: 502,
        code: "sign_out_failed",
        message: "Could not revoke the session."
      };
    }
  } catch {
    return {
      ok: false,
      status: 502,
      code: "sign_out_failed",
      message: "Could not revoke the session."
    };
  }

  return {
    ok: true,
    status: 204
  };
}
