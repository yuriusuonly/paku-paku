import { useEffect } from "react";
import Head from "expo-router/head";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Text, View } from "react-native";
import config from "../constants/config.js";
import { CircularProgress } from "../components/circular-progress.js";
import { SnackbarHost } from "../components/snackbar.js";
import { useAuthStore } from "../stores/auth.store.js";
import { colors, cx } from "../constants/theme.js";

import "../stylesheets/global.css";

/**
 * Root layout route (`app/_layout.js`): loads fonts, bootstraps session
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
    Outfit: require("../ttf/Outfit-VariableFont_wght.ttf")
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
      <View className={`flex-1 items-center justify-center ${cx.bgApp}`}>
        <CircularProgress size="large" />
      </View>
    );
  }

  return (
    <>
      <Head>
        <title>{config.title}</title>
      </Head>
      <View className="flex-1">
        <View
          className={`w-full border-b ${cx.borderSubtle} ${cx.bgPrimarySoft} px-4 py-2`}
          style={{ position: "sticky", top: 0, zIndex: 50 }}
        >
          <Text className={`font-outfit text-center text-sm font-semibold ${cx.textPrimary}`}>
            Under active development
          </Text>
        </View>
        <View className="flex-1">
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.white }
            }}
          />
        </View>
      </View>
      <SnackbarHost />
    </>
  );
}
