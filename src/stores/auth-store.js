import { create } from "zustand";
import { getSession, signUp as signUpApi, signIn as signInApi, signOut as signOutApi } from "../services/auth.js";
import { notifyBackgroundError } from "./notification-store.js";

/**
 * Authentication/session store.
 * @module stores/auth-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;

/**
 * Local storage key for the persisted session.
 *
 * @type {string}
 */
const STORAGE_KEY = "paku-paku.session";

/**
 * @typedef {object} Session
 * @property {string} access_token - Bearer access token.
 * @property {string} refresh_token - Refresh token.
 * @property {number} [expires_at] - Expiration timestamp.
 * @property {number} [expires_in] - Lifetime in seconds.
 * @property {string} [token_type] - Token type.
 */

/**
 * Reads the persisted session from local storage.
 *
 * @returns {Session | null} Persisted session or `null`.
 */
function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists or clears the session in local storage.
 *
 * @param {Session | null} session - Session to persist.
 * @returns {void}
 */
function writeStoredSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode/quota); keep in-memory state.
  }
}

/**
 * Zustand store hook for authentication state and actions.
 *
 * @type {import("zustand").UseBoundStore<import("zustand").StoreApi<{user: object | null, session: Session | null, status: "idle" | "loading" | "authenticated" | "unauthenticated", error: string | null, hydrated: boolean, hydrate: () => Promise<void>, signIn: (credentials: {username: string, password: string}) => Promise<{ok: boolean, error?: string}>, signOut: () => Promise<void>, clearError: () => void}>>}
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  status: "idle",
  error: null,
  hydrated: false,
  storageSyncAttached: false,

  /**
   * Restores a persisted session and validates it against the API.
   *
   * @returns {Promise<void>}
   */
  attachStorageSync: () => {
    if (get().storageSyncAttached || typeof window === "undefined") return;
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      // Another tab/device context updated session storage; rehydrate to reflect it.
      set({ hydrated: false });
      void get().hydrate();
    });
    set({ storageSyncAttached: true });
  },

  hydrate: async () => {
    get().attachStorageSync();
    if (get().hydrated) {
      return;
    }

    const session = readStoredSession();

    if (!session?.access_token) {
      set({ user: null, session: null, status: "unauthenticated", hydrated: true });
      return;
    }

    set({ status: "loading", error: null });

    try {
      const data = await getSession(session.access_token);
      set({
        user: data.user,
        session,
        status: "authenticated",
        error: null,
        hydrated: true
      });
    } catch (error) {
      writeStoredSession(null);
      set({
        user: null,
        session: null,
        status: "unauthenticated",
        error: friendlyError(error, "Your session expired. Please sign in again."),
        hydrated: true
      });
    }
  },

  /**
   * Signs in and persists the returned session.
   *
   * @param {{username: string, password: string}} credentials - Sign-in credentials.
   * @returns {Promise<{ok: boolean, error?: string}>} Result for the caller/UI.
   */
  signIn: async (credentials) => {
    set({ status: "loading", error: null });

    try {
      const data = await signInApi(credentials);
      writeStoredSession(data.session);
      set({
        user: data.user,
        session: data.session,
        status: "authenticated",
        error: null,
        hydrated: true
      });
      return { ok: true };
    } catch (error) {
      const message = friendlyError(error, "Unable to sign in. Please check your details and try again.");
      set({ status: "unauthenticated", error: message, user: null, session: null });
      return { ok: false, error: message };
    }
  },

  /**
   * Signs up a new customer account and persists the session when returned.
   *
   * @param {{username: string, password: string}} credentials - Sign-up credentials.
   * @returns {Promise<{ok: boolean, error?: string}>} Result for the caller/UI.
   */
  signUp: async (credentials) => {
    set({ status: "loading", error: null });

    try {
      const data = await signUpApi(credentials);
      if (data.session) {
        writeStoredSession(data.session);
        set({
          user: data.user,
          session: data.session,
          status: "authenticated",
          error: null,
          hydrated: true
        });
      } else {
        set({ status: "unauthenticated", error: null, hydrated: true });
      }
      return { ok: true, requiresSignIn: !data.session };
    } catch (error) {
      const message = friendlyError(error, "Unable to create your account. Please try again.");
      set({ status: "unauthenticated", error: message, user: null, session: null });
      return { ok: false, error: message };
    }
  },

  /**
   * Signs out locally and revokes the server session when possible.
   *
   * @returns {Promise<void>}
   */
  signOut: async () => {
    const { session } = get();
    writeStoredSession(null);
    set({ user: null, session: null, status: "unauthenticated", error: null });

    if (session?.access_token) {
      try {
        await signOutApi(session.access_token);
      } catch (error) {
        // Local sign-out already completed; server revocation is best-effort.
        notifyBackgroundError(
          friendlyError(error, "You were signed out locally, but we couldn't fully end the server session.")
        );
      }
    }
  },

  /**
   * Clears the current auth error message.
   *
   * @returns {void}
   */
  clearError: () => set({ error: null })
}));
