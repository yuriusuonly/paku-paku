/**
 * Application configuration composed from environment variables.
 * This module is the single source of truth for app, API, and database settings.
 * @module shared/constants/config
 */

/**
 * @typedef {object} ApiEndpoints
 * @property {string} health
 * @property {string} menuItems
 * @property {string} signup
 * @property {string} signin
 * @property {string} session
 * @property {string} signout
 * @property {string} recover
 * @property {string} orders
 * @property {string} transactions
 * @property {string} accountProfile
 * @property {string} adminProfiles
 * @property {string} adminInventory
 * @property {string} adminSales
 * @property {string} adminOrders
 * @property {string} adminTransactions
 */

/**
 * @typedef {object} ApiConfig
 * @property {string} basePath
 * @property {ApiEndpoints} endpoints
 */

/**
 * @typedef {object} DatabaseConfig
 * @property {string} target - `local` or `hosted`.
 * @property {boolean} isHosted - Whether target is hosted.
 * @property {string | undefined} url - Client-facing database API URL for selected target.
 * @property {string | undefined} anonKey - Client-facing anon key for selected target.
 * @property {string | undefined} serverUrl - Server-side database API URL for selected target.
 * @property {string | undefined} serverAnonKey - Server-side anon key for selected target.
 */

/**
 * @typedef {object} AppConfig
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property {string | undefined} version
 * @property {ApiConfig} api
 * @property {DatabaseConfig} database
 */

const apiBasePath = process.env.EXPO_PUBLIC_URL_API_BASE_PATH || "/api";
const databaseTarget = process.env.EXPO_PUBLIC_SUPABASE_TARGET === "hosted" ? "hosted" : "local";
const isHosted = databaseTarget === "hosted";

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
    signup: `${apiBasePath}/signup`,
    signin: `${apiBasePath}/signin`,
    session: `${apiBasePath}/session`,
    signout: `${apiBasePath}/signout`,
    recover: `${apiBasePath}/recover`,
    orders: `${apiBasePath}/orders`,
    transactions: `${apiBasePath}/transactions`,
    accountProfile: `${apiBasePath}/account/profile`,
    adminProfiles: `${apiBasePath}/admin/profiles`,
    adminInventory: `${apiBasePath}/admin/inventory`,
    adminSales: `${apiBasePath}/admin/sales`,
    adminOrders: `${apiBasePath}/admin/orders`,
    adminTransactions: `${apiBasePath}/admin/transactions`
  }
};

const runningInDocker = process.env.RUNNING_IN_DOCKER === "1";

/**
 * Centralized database configuration.
 *
 * @type {DatabaseConfig}
 */
export const database = {
  target: databaseTarget,
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
  database
};

export default config;
