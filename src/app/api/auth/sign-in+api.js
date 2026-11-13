import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody
} from "../../../shared/api.js";
import {
  loginEmailForUsername,
  normalizeUsername,
  publicProfile,
  USERNAME_PATTERN
} from "../../../shared/api-auth.js";
import { createSupabaseServerClient } from "../../../shared/supabase-server.js";

/**
 * Username/password sign-in (`src/app/api/auth/sign-in+api.js`).
 *
 * Usernames are mapped to the internal Auth email and exchanged with GoTrue.
 * The response returns the Supabase session tokens; the browser client is
 * responsible for storing them through `supabase.auth.setSession()`.
 * @module app/api/auth/sign-in+api
 */

/**
 * POST handler for `/api/auth/sign-in`.
 *
 * @param {Request} request - Incoming request with `{ username, password }` JSON.
 * @returns {Promise<Response>} Session tokens and the public profile, or a standardized error.
 */
export async function POST(request) {
  const body = await readJsonBody(request);

  if (!body) {
    return errorResponse(400, "invalid_body", "Expected a JSON object with username and password.");
  }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    return errorResponse(400, "invalid_credentials", "Enter a valid username and password.");
  }

  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return errorResponse(503, "supabase_unconfigured", "Supabase is not configured for server routes.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmailForUsername(username),
    password
  });

  if (error || !data.session) {
    if (error?.status === 429) {
      return errorResponse(429, "rate_limited", "Too many sign-in attempts. Try again later.");
    }

    return errorResponse(401, "invalid_credentials", "Invalid username or password.");
  }

  const authenticated = createSupabaseServerClient({
    accessToken: data.session.access_token
  });

  const { data: profile, error: profileError } = await authenticated
    .from("profiles")
    .select("id, username, role, created_at, updated_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    return errorResponse(500, "profile_unavailable", "Could not load the account profile.");
  }

  if (!profile) {
    return errorResponse(403, "profile_missing", "This account has no profile.");
  }

  return jsonResponse({
    user: publicProfile(profile),
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type
    }
  });
}

/**
 * Rejects unsupported methods.
 *
 * @returns {Response} `405 Method Not Allowed`.
 */
export function GET() {
  return methodNotAllowed("POST");
}
