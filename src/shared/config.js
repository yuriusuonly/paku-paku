/**
 * Application configuration composed from environment variables.
 * This module is the single source of truth for app, API, and Supabase settings.
 * @module shared/config
 */

/**
 * @typedef {object} ApiEndpoints
 * @property {string} health
 * @property {string} menuItems
 * @property {string} authSignIn
 * @property {string} authSession
 * @property {string} authSignOut
 * @property {string} adminProfiles
 */

/**
 * @typedef {object} ApiConfig
 * @property {string} basePath
 * @property {ApiEndpoints} endpoints
 */

/**
 * @typedef {object} SupabaseConfig
 * @property {string} target - `local` or `hosted`.
 * @property {boolean} isHosted - Whether target is hosted.
 * @property {string | undefined} url - Client-facing Supabase API URL for selected target.
 * @property {string | undefined} anonKey - Client-facing anon key for selected target.
 * @property {string | undefined} serverUrl - Server-side Supabase API URL for selected target.
 * @property {string | undefined} serverAnonKey - Server-side anon key for selected target.
 */

/**
 * @typedef {object} AppConfig
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property {string | undefined} version
 * @property {ApiConfig} api
 * @property {SupabaseConfig} supabase
 */

const apiBasePath = process.env.EXPO_PUBLIC_URL_API_BASE_PATH || "/api";
const supabaseTarget = process.env.EXPO_PUBLIC_SUPABASE_TARGET === "hosted" ? "hosted" : "local";
const isHosted = supabaseTarget === "hosted";

/**
 * Centralized API configuration.
 *
 * @type {ApiConfig}
 */
export const api = {
  basePath: apiBasePath,
  endpoints: {
    health: `${apiBasePath}/health`,
    menuItems: `${apiBasePath}/menu-items`,
    authSignUp: `${apiBasePath}/auth/signup`,
    authSignIn: `${apiBasePath}/auth/sign-in`,
    authSession: `${apiBasePath}/auth/session`,
    authSignOut: `${apiBasePath}/auth/sign-out`,
    adminProfiles: `${apiBasePath}/admin/profiles`
  }
};

const runningInDocker = process.env.RUNNING_IN_DOCKER === "1";

/**
 * Centralized Supabase configuration.
 *
 * @type {SupabaseConfig}
 */
export const supabase = {
  target: supabaseTarget,
  isHosted,
  url: isHosted ? process.env.EXPO_PUBLIC_SUPABASE_URL : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL,
  anonKey: isHosted
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY,
  serverUrl: isHosted
    ? process.env.EXPO_PUBLIC_SUPABASE_URL
    : (runningInDocker ? process.env.SUPABASE_LOCAL_SERVER_URL : null) ||
      process.env.EXPO_PUBLIC_SUPABASE_LOCAL_URL ||
      process.env.SUPABASE_LOCAL_SERVER_URL,
  serverAnonKey: isHosted
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    : process.env.EXPO_PUBLIC_SUPABASE_LOCAL_ANON_KEY
};

/**
 * Default shared app config.
 *
 * @type {AppConfig}
 */
const config = {
  title: process.env.EXPO_PUBLIC_TITLE,
  description: process.env.EXPO_PUBLIC_DESCRIPTION,
  version: process.env.EXPO_PUBLIC_VERSION,
  api,
  supabase
};

export default config;
