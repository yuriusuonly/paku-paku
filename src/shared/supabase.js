import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client selection and initialization.
 *
 * `EXPO_PUBLIC_SUPABASE_TARGET` selects the environment at build time:
 * `"hosted"` (set by `npm run eas:deploy`) uses the hosted project, while
 * anything else — including local dev and local static builds — uses the local
 * Supabase stack. There is no fallback between the two environments.
 *
 * @module shared/supabase
 */

/**
 * Whether this build targets the hosted Supabase project instead of the local
 * stack. Only the deploy pipeline sets `EXPO_PUBLIC_SUPABASE_TARGET=hosted`.
 *
 * @type {boolean}
 */
const isHosted = process.env.EXPO_PUBLIC_SUPABASE_TARGET === "hosted";

/**
 * Supabase API URL for the selected environment.
 *
 * @type {string | undefined}
 */
const supabaseUrl = isHosted
  ? process.env.EXPO_PUBLIC_SUPABASE_URL
  : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL;

/**
 * Supabase anon (publishable) key for the selected environment.
 *
 * @type {string | undefined}
 */
const supabaseAnonKey = isHosted
  ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY;

/**
 * Lazily created shared client, so importing this module never initializes
 * Supabase until a caller actually needs it.
 *
 * @type {import("@supabase/supabase-js").SupabaseClient | null}
 */
let client = null;

/**
 * Returns the shared Supabase client for the selected environment.
 *
 * Throws a descriptive error when the matching environment is not configured,
 * so local and hosted credentials can never be mixed up silently.
 *
 * @returns {import("@supabase/supabase-js").SupabaseClient} The shared Supabase client.
 */
export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const environment = isHosted ? "hosted" : "local";
    const prefix = isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw new Error(
      `Supabase ${environment} environment is not configured. ` +
        `Set ${prefix}_URL and ${prefix}_ANON_KEY in .env.`
    );
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  return client;
}
