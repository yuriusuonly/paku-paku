import { getDatabaseClient } from "../database/instance.js";

/**
 * Client realtime subscription helpers.
 * @module services/realtime
 */

/**
 * Sets the realtime auth token for the browser database client.
 *
 * @param {string | null | undefined} token - Access token.
 * @returns {void}
 */
export function setRealtimeAuth(token) {
  if (!token) return;
  try {
    getDatabaseClient().realtime.setAuth(token);
  } catch {}
}

/**
 * Subscribes to postgres changes on a table.
 *
 * @param {{channelName: string, table: string, onPayload: (payload: object) => void, onStatus?: (status: string) => void, token?: string | null}} options - Subscription options.
 * @returns {import("@supabase/supabase-js").RealtimeChannel} Realtime channel.
 */
export function subscribeToTableChanges({ channelName, table, onPayload, onStatus, token }) {
  const database = getDatabaseClient();
  if (token) {
    database.realtime.setAuth(token);
  }
  const channel = database
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table }, onPayload)
    .subscribe((status) => {
      if (typeof onStatus === "function") {
        onStatus(status);
      }
    });
  return channel;
}

/**
 * Removes a realtime channel subscription.
 *
 * @param {import("@supabase/supabase-js").RealtimeChannel | null | undefined} channel - Channel to remove.
 * @returns {Promise<void>}
 */
export async function removeRealtimeChannel(channel) {
  if (!channel) return;
  await getDatabaseClient().removeChannel(channel);
}
