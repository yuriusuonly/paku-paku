import { create } from "zustand";
import { sortByCreatedDesc } from "../helpers/lists.js";
import { getErrorMessage } from "../../lib/errors/message.js";
import { getAuditLogs } from "../services/audit.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification.store.js";

/**
 * Admin audit log store with API-backed loading and realtime refresh.
 * @module stores/audit-logs.store
 */

export const useAuditLogsStore = create((set, get) => ({
  logs: [],
  loading: false,
  syncing: false,
  error: null,
  channel: null,
  refetchTimer: null,
  token: null,

  clearError: () => set({ error: null }),

  fetchLogs: async (token, { background = false } = {}) => {
    if (!token) return set({ logs: [], loading: false });
    set({ token, loading: !background, syncing: background, error: null });
    try {
      const data = await getAuditLogs(token, { limit: 200 });
      set({ logs: sortByCreatedDesc(data.logs || []), loading: false, syncing: false });
    } catch (error) {
      set({
        loading: false,
        syncing: false,
        error: getErrorMessage(error, "Could not load audit logs.")
      });
      throw error;
    }
  },

  subscribe: (token) => {
    if (!token) return;
    set({ token });
    if (get().channel) {
      setRealtimeAuth(token);
      return;
    }
    try {
      const channel = subscribeToTableChanges({
        channelName: "public:audit_logs",
        table: "audit_logs",
        token,
        onPayload: () => {
          const { refetchTimer, fetchLogs } = get();
          if (refetchTimer) clearTimeout(refetchTimer);
          const timer = setTimeout(() => {
            const currentToken = get().token;
            if (currentToken) void fetchLogs(currentToken, { background: true }).catch(() => {});
            set({ refetchTimer: null });
          }, 250);
          set({ refetchTimer: timer, syncing: true });
        }
      });
      set({ channel });
    } catch (error) {
      notifyBackgroundError(getErrorMessage(error, "Could not connect to live audit updates."));
    }
  },

  unsubscribe: async () => {
    const { channel, refetchTimer } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    if (channel) {
      try { await removeRealtimeChannel(channel); } catch {}
    }
    set({ channel: null, refetchTimer: null, token: null });
  }
}));
