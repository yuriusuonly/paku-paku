import { useEffect } from "react";
import Head from "expo-router/head";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { View } from "react-native";
import config from "../shared/constants/config.js";
import { CircularProgress } from "../components/circular-progress.js";
import { SnackbarHost } from "../components/snackbar.js";
import { useAuthStore } from "../stores/auth-store.js";

import "../shared/stylesheets/global.css";

/**
 * Root layout route (`src/app/_layout.js`): loads fonts, bootstraps session
 * state, registers the service worker, and renders the app navigator.
 * @module app/_layout
 */

/**
 * Root navigator layout shared by every route.
 *
 * @returns {JSX.Element} The app navigator.
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
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <CircularProgress size="large" />
      </View>
    );
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
      <SnackbarHost />
    </>
  );
}
