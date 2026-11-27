/**
 * Application configuration composed from environment variables.
 * This module is the single source of truth for app, API, and database settings.
 * @module constants/config
 */

/**
 * @typedef {object} ApiEndpoints
 * @property {string} health
 * @property {string} items
 * @property {string} signin
 * @property {string} session
 * @property {string} signout
 * @property {string} checkout
 * @property {string} adminProfiles
 * @property {string} adminOrders
 * @property {string} adminAuditLogs
 * @property {string} staffOrders
 * @property {string} staffVerifyOrder
 * @property {string} staffOrder
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
 * @typedef {object} CurrencyConfig
 * @property {string} code - ISO-style currency code (e.g. PHP).
 * @property {string} symbol - Currency symbol (e.g. ₱).
 */

/**
 * @typedef {object} AppConfig
 * @property {string | undefined} title
 * @property {string | undefined} description
 * @property {string | undefined} version
 * @property {ApiConfig} api
 * @property {DatabaseConfig} database
 * @property {CurrencyConfig} currency
 * @property {string} repository - Public GitHub repository URL.
 * @property {{email: string | undefined, password: string | undefined}} guest
 */

const apiPath = process.env.EXPO_PUBLIC_URL_API_BASE_PATH || "api";
const apiBasePath = `/${apiPath.replace(/^\/+/, "")}`;
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
    items: `${apiBasePath}/items`,
    signin: `${apiBasePath}/signin`,
    session: `${apiBasePath}/session`,
    signout: `${apiBasePath}/signout`,
    checkout: `${apiBasePath}/checkout`,
    adminProfiles: `${apiBasePath}/admin/profiles`,
    adminOrders: `${apiBasePath}/admin/orders`,
    adminAuditLogs: `${apiBasePath}/admin/audit-logs`,
    staffOrders: `${apiBasePath}/staff/orders`,
    staffVerifyOrder: `${apiBasePath}/staff/orders/verify`,
    staffOrder: `${apiBasePath}/staff/orders`
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
 * Centralized currency configuration.
 *
 * @type {CurrencyConfig}
 */
export const currency = {
  code: process.env.EXPO_PUBLIC_CURRENCY_CODE || "PHP",
  symbol: process.env.EXPO_PUBLIC_CURRENCY_SYMBOL || "₱"
};

/**
 * Public GitHub repository URL shown in the global banner.
 *
 * @type {string}
 */
export const repository = "https://github.com/yuriusuonly/paku-paku";

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
  database,
  currency,
  repository,
  guest: {
    email: process.env.EXPO_PUBLIC_GUEST_EMAIL,
    password: process.env.EXPO_PUBLIC_GUEST_PASSWORD
  }
};

export default config;
