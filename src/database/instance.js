import { createClient } from "@supabase/supabase-js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { database as databaseConfig } from "../shared/constants/config.js";

/**
 * Database client instance and runtime selection.
 * Configuration is sourced from `shared/config.js`.
 * @module database/instance
 */

/**
 * @typedef {object} DatabaseClient
 */

/**
 * @typedef {object} DatabaseServerConfig
 * @property {string} url
 * @property {string} anonKey
 * @property {boolean} isHosted
 */

/**
 * @type {DatabaseClient | null}
 */
let browserClient = null;

/**
 * Returns the shared browser database client for the configured environment.
 *
 * @returns {DatabaseClient} Browser database client.
 */
export function getDatabaseClient() {
  if (!databaseConfig.url || !databaseConfig.anonKey) {
    const environment = databaseConfig.isHosted ? "hosted" : "local";
    const prefix = databaseConfig.isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw databaseUnconfigured(
      `Database ${environment} environment is not configured. Set ${prefix}_URL and ${prefix}_ANON_KEY in .env.`
    );
  }

  if (!browserClient) {
    browserClient = createClient(databaseConfig.url, databaseConfig.anonKey, {
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
 * Returns server-side database configuration for the selected environment.
 *
 * @returns {DatabaseServerConfig} Server database config.
 */
export function getDatabaseServerConfig() {
  if (!databaseConfig.serverUrl || !databaseConfig.serverAnonKey) {
    const environment = databaseConfig.isHosted ? "hosted" : "local";
    const prefix = databaseConfig.isHosted ? "EXPO_PUBLIC_SUPABASE" : "EXPO_PUBLIC_SUPABASE_LOCAL";
    throw databaseUnconfigured(
      `Database ${environment} environment is not configured for server routes. Set ${prefix}_URL and ${prefix}_ANON_KEY in .env (Docker also accepts SUPABASE_LOCAL_SERVER_URL when RUNNING_IN_DOCKER=1).`
    );
  }

  return {
    url: databaseConfig.serverUrl,
    anonKey: databaseConfig.serverAnonKey,
    isHosted: databaseConfig.isHosted
  };
}

/**
 * Creates a request-scoped database client for server API routes.
 *
 * @param {object} [options] - Client options.
 * @param {string} [options.accessToken] - Caller bearer token.
 * @returns {DatabaseClient} Server database client.
 */
export function createDatabaseClient({ accessToken } = {}) {
  const { url, anonKey } = getDatabaseServerConfig();

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
