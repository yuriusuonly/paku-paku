import { create } from "zustand";
import { getProfiles, createProfileUser, updateProfile as updateProfileApi } from "../services/admin.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification-store.js";

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function isVisibleProfile(profile) {
  return profile?.email !== "root@paku-paku";
}

function sortProfiles(items) {
  return [...items].sort((a, b) => String(a.email || "").localeCompare(String(b.email || "")));
}

function isSameRecord(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.is(a[key], b[key]));
}

function upsertProfile(items, profile) {
  if (!isVisibleProfile(profile)) {
    return items.filter((entry) => entry.id !== profile?.id && entry.email !== "root@paku-paku");
  }
  const index = items.findIndex((entry) => entry.id === profile.id);
  if (index === -1) {
    return sortProfiles([...items, profile]);
  }
  if (isSameRecord(items[index], { ...items[index], ...profile })) {
    return items;
  }
  const next = [...items];
  next[index] = { ...next[index], ...profile };
  return sortProfiles(next);
}

export const useProfilesStore = create((set, get) => ({
  profiles: [],
  loading: false,
  syncing: false,
  error: null,
  channel: null,
  subscribed: false,

  clearError: () => set({ error: null }),

  fetchProfiles: async (token, { background = false } = {}) => {
    if (!token) {
      set({ profiles: [], loading: false, syncing: false, error: null });
      return;
    }
    const hasData = get().profiles.length > 0;
    const isRefresh = background || hasData;
    set({ loading: !isRefresh, syncing: isRefresh, error: null });
    try {
      const data = await getProfiles(token);
      set({
        profiles: sortProfiles((data.profiles || []).filter(isVisibleProfile)),
        loading: false,
        syncing: false,
        error: null
      });
    } catch (error) {
      const message = friendlyError(error, "Could not load profiles. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasData) notifyBackgroundError(message);
      throw error;
    }
  },

  createUser: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createProfileUser(token, input);
      if (data?.profile) {
        set((s) => ({ profiles: upsertProfile(s.profiles, data.profile) }));
      }
      return data?.profile;
    } catch (error) {
      const message = friendlyError(error, "Could not create the user. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  setProfileActive: async (token, id, isActive) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateProfileApi(token, { id, is_active: isActive });
      if (data?.profile) {
        set((s) => ({ profiles: upsertProfile(s.profiles, data.profile) }));
      }
      return data?.profile;
    } catch (error) {
      const message = friendlyError(error, "Could not update the profile. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  subscribe: (token) => {
    if (get().channel) {
      setRealtimeAuth(token);
      return;
    }
    try {
      const channel = subscribeToTableChanges({
        channelName: "public:profiles",
        table: "profiles",
        token,
        onPayload: (payload) => {
          let changed = false;
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id && get().profiles.some((p) => p.id === id)) {
              changed = true;
              set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id), syncing: true }));
            }
          } else if (payload.new) {
            const profile = payload.new;
            const current = get().profiles.find((entry) => entry.id === profile.id);
            const visible = isVisibleProfile(profile);
            if (!visible && current) {
              changed = true;
              set((s) => ({ profiles: s.profiles.filter((p) => p.id !== profile.id && p.email !== "root@paku-paku"), syncing: true }));
            } else if (visible && !isSameRecord(current, current ? { ...current, ...profile } : profile)) {
              changed = true;
              set((s) => ({ profiles: upsertProfile(s.profiles, profile), syncing: true }));
            }
          }
          if (changed) {
            setTimeout(() => set({ syncing: false }), 350);
          }
        },
        onStatus: (status) => {
          if (status === "SUBSCRIBED") set({ subscribed: true, error: null });
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            notifyBackgroundError("Live profile updates are temporarily unavailable.");
          }
        }
      });
      set({ channel });
    } catch (error) {
      notifyBackgroundError(friendlyError(error, "Could not connect to live profile updates."));
    }
  },

  unsubscribe: async () => {
    const { channel } = get();
    if (!channel) return;
    try {
      await removeRealtimeChannel(channel);
    } catch {
      notifyBackgroundError("Could not disconnect live profile updates cleanly.");
    } finally {
      set({ channel: null, subscribed: false });
    }
  },

  reset: () => set({ profiles: [], loading: false, syncing: false, error: null })
}));
