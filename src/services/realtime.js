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
 * Normalizes a broadcast payload to a postgres_changes-like shape.
 *
 * @param {object} payload - Incoming payload.
 * @param {string} table - Table name fallback.
 * @returns {{eventType: string, new: object | null, old: object | null, schema: string, table: string}} Normalized payload.
 */
function normalizeChangePayload(payload, table) {
  const data = payload && typeof payload === "object" && "payload" in payload ? payload.payload : payload;
  const eventType = String(data?.eventType || data?.event || payload?.event || "UPDATE").toUpperCase();
  return {
    eventType,
    new: data?.new ?? data?.record ?? null,
    old: data?.old ?? data?.old_record ?? null,
    schema: data?.schema || "public",
    table: data?.table || table
  };
}

/**
 * Subscribes to table changes via broadcast events (not gated by row visibility).
 * Falls back-compatible with postgres_changes payload shape for handlers.
 *
 * @param {{channelName: string, table: string, onPayload: (payload: object) => void, onStatus?: (status: string) => void, token?: string | null}} options - Subscription options.
 * @returns {import("@supabase/supabase-js").RealtimeChannel} Realtime channel.
 */
export function subscribeToTableChanges({ channelName, table, onPayload, onStatus, token }) {
  const database = getDatabaseClient();
  if (token) {
    database.realtime.setAuth(token);
  }

  const channel = database.channel(channelName, { config: { broadcast: { self: true } } });

  for (const event of ["INSERT", "UPDATE", "DELETE"]) {
    channel.on("broadcast", { event }, (payload) => {
      onPayload(normalizeChangePayload(payload, table));
    });
  }

  channel
    .on("broadcast", { event: "*" }, (payload) => {
      onPayload(normalizeChangePayload(payload, table));
    })
    .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
      onPayload(normalizeChangePayload(payload, table));
    })
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
