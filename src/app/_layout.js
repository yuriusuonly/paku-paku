import { useEffect } from "react";
import Head from "expo-router/head";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import config from "../shared/config.js";
import { useAuthStore } from "../stores/auth-store.js";

import "../stylesheets/global.css";

/**
 * Root layout route (`src/app/_layout.js`): loads fonts, bootstraps session
 * state, registers the service worker, and renders the app navigator.
 * @module app/_layout
 */

/**
 * Root navigator layout shared by every route.
 *
 * @returns {JSX.Element | null} The app navigator once fonts are ready.
 */
export default function Layout() {
  const [loaded] = useFonts({
    Outfit: require("../../ttf/Outfit-VariableFont_wght.ttf")
  });
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Service worker registration is optional in local/dev contexts.
      });
    }
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{config.title}</title>
      </Head>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#fff" }
        }}
      />
    </>
  );
}
