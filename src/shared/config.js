/**
 * Application configuration composed from environment variables.
 * This module is the single source of truth for client-visible app and API settings.
 * @module shared/config
 */

/**
 * API endpoint paths relative to the API base path.
 *
 * @typedef {object} ApiEndpoints
 * @property {string} health - Health check endpoint.
 * @property {string} menuItems - Public menu items endpoint.
 * @property {string} authSignIn - Sign-in endpoint.
 * @property {string} authSession - Current session endpoint.
 * @property {string} authSignOut - Sign-out endpoint.
 * @property {string} adminProfiles - Admin profiles endpoint.
 */

/**
 * API configuration.
 *
 * @typedef {object} ApiConfig
 * @property {string} basePath - Base path for API routes.
 * @property {ApiEndpoints} endpoints - Named API endpoint paths.
 */

/**
 * App metadata and API configuration.
 *
 * @typedef {object} AppConfig
 * @property {string} [title] - App/site title (`EXPO_PUBLIC_TITLE`).
 * @property {string} [description] - App/site description (`EXPO_PUBLIC_DESCRIPTION`).
 * @property {string} [version] - App version string (`EXPO_PUBLIC_VERSION`).
 * @property {ApiConfig} api - API configuration.
 */

const apiBasePath = process.env.EXPO_PUBLIC_API_BASE_PATH || "/api";

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
    authSignIn: `${apiBasePath}/auth/sign-in`,
    authSession: `${apiBasePath}/auth/session`,
    authSignOut: `${apiBasePath}/auth/sign-out`,
    adminProfiles: `${apiBasePath}/admin/profiles`
  }
};

/**
 * Default shared app config consumed by routes and UI.
 *
 * @type {AppConfig}
 */
const config = {
  title: process.env.EXPO_PUBLIC_TITLE,
  description: process.env.EXPO_PUBLIC_DESCRIPTION,
  version: process.env.EXPO_PUBLIC_VERSION,
  api
};

export default config;
