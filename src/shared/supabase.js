import { createClient } from "@supabase/supabase-js";
import { supabaseUnconfigured } from "../errors/supabase-unconfigured.js";
import { supabase as supabaseConfig } from "./config.js";

/**
 * Unified Supabase client module for browser and server runtimes.
 * Configuration is sourced from `shared/config.js`.
 * @module shared/supabase
 */

/**
 * @type {import("@supabase/supabase-js").SupabaseClient | null}
 */
let browserClient = null;

/**
 * Returns the shared browser Supabase client for the configured environment.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient} Browser client.
 */
export function getSupabase() {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    const environment = supabaseConfig.isHosted ? "hosted" : "local";
    const prefix = supabaseConfig.isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw supabaseUnconfigured(
      `Supabase ${environment} environment is not configured. Set ${prefix}_URL and ${prefix}_ANON_KEY in .env.`
    );
  }

  if (!browserClient) {
    browserClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return browserClient;
}

/**
 * Returns server-side Supabase configuration for the selected environment.
 *
 * @returns {{url: string, anonKey: string, isHosted: boolean}} Server config.
 */
export function getSupabaseServerConfig() {
  if (!supabaseConfig.serverUrl || !supabaseConfig.serverAnonKey) {
    const environment = supabaseConfig.isHosted ? "hosted" : "local";
    const prefix = supabaseConfig.isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw supabaseUnconfigured(
      `Supabase ${environment} environment is not configured for server routes. Set ${prefix}_URL and ${prefix}_ANON_KEY in .env (Docker also accepts SUPABASE_LOCAL_SERVER_URL when RUNNING_IN_DOCKER=1).`
    );
  }

  return {
    url: supabaseConfig.serverUrl,
    anonKey: supabaseConfig.serverAnonKey,
    isHosted: supabaseConfig.isHosted
  };
}

/**
 * Creates a request-scoped Supabase client for server API routes.
 *
 * @param {object} [options] - Client options.
 * @param {string} [options.accessToken] - Caller bearer token.
 * @returns {import("@supabase/supabase-js").SupabaseClient} Server client.
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
