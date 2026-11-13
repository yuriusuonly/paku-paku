import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client factory for server-side API routes.
 *
 * Server routes never persist sessions. They forward the caller's access token
 * to PostgREST and GoTrue so row-level security and token verification run with
 * the user's own privileges. Only the anon/publishable key is used; a
 * service-role key must never be imported here.
 *
 * `EXPO_PUBLIC_SUPABASE_TARGET` keeps the same local/hosted split as the
 * browser client. Dockerized local APIs reach Kong over the Supabase Docker
 * network through `SUPABASE_LOCAL_SERVER_URL` (the host loopback is not
 * reachable from inside the app container). There is no cross-environment
 * fallback.
 *
 * @module shared/supabase-server
 */

/**
 * Whether this process targets the hosted Supabase project instead of the
 * local stack. Only production deploys set the target to `hosted`.
 *
 * @type {boolean}
 */
const isHosted = process.env.EXPO_PUBLIC_SUPABASE_TARGET === "hosted";

/**
 * Supabase API URL used by server-side code.
 *
 * @type {string | undefined}
 */
const supabaseUrl = isHosted
  ? process.env.EXPO_PUBLIC_SUPABASE_URL
  : process.env.SUPABASE_LOCAL_SERVER_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL;

/**
 * Supabase anon (publishable) key used by server-side code.
 *
 * @type {string | undefined}
 */
const supabaseAnonKey = isHosted
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY;

/**
 * Returns the configured server-side Supabase URL and anon key.
 *
 * Throws a descriptive error when the selected environment is not configured,
 * so a server route can never silently mix local and hosted credentials.
 *
 * @returns {{url: string, anonKey: string, isHosted: boolean}} Resolved server configuration.
 */
export function getSupabaseServerConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const environment = isHosted ? "hosted" : "local";
    const prefix = isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw new Error(
      `Supabase ${environment} environment is not configured for server routes. ` +
        `Set ${prefix}_URL and ${prefix}_ANON_KEY in .env (Docker also accepts SUPABASE_LOCAL_SERVER_URL).`
    );
  }

  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isHosted
  };
}

/**
 * Creates a request-scoped Supabase client for a server API route.
 *
 * @param {object} [options] - Client options.
 * @param {string} [options.accessToken] - Caller access token forwarded as a bearer credential.
 * @returns {import("@supabase/supabase-js").SupabaseClient} Supabase client with sessions disabled.
 */
export function createSupabaseServerClient({ accessToken } = {}) {
  const { url, anonKey } = getSupabaseServerConfig();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
}
