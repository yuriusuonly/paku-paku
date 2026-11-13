import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../components/alert.js";
import { Header } from "../components/header.js";
import { CircularProgress } from "../components/circular-progress.js";
import { ScreenContainer } from "../components/container.js";
import config from "../shared/config.js";
import { useAuthStore } from "../stores/auth-store.js";
import { useMenuStore } from "../stores/menu-store.js";
import { cx } from "../shared/theme.js";

/**
 * Home/storefront screen with menu synced from the store/database.
 * @module screens/root
 */

/**
 * Formats a price in cents as a currency string.
 *
 * @param {number} cents - Price in cents.
 * @returns {string} Formatted price.
 */
function formatPrice(cents) {
  return `¥${(cents / 100).toFixed(0)}`;
}

/**
 * Home screen component.
 *
 * @returns {JSX.Element} Home screen.
 */
export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const authStatus = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  const items = useMenuStore((state) => state.items);
  const loading = useMenuStore((state) => state.loading);
  const syncing = useMenuStore((state) => state.syncing);
  const error = useMenuStore((state) => state.error);
  const fetchItems = useMenuStore((state) => state.fetchItems);
  const subscribe = useMenuStore((state) => state.subscribe);
  const unsubscribe = useMenuStore((state) => state.unsubscribe);
  const resetMenu = useMenuStore((state) => state.reset);

  const isAuthenticated = authStatus === "authenticated" && Boolean(user && session?.access_token);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated || !session?.access_token) {
      void unsubscribe();
      resetMenu();
      return;
    }

    void fetchItems(session.access_token).catch(() => {});
    subscribe(session.access_token);

    return () => {
      void unsubscribe();
    };
  }, [hydrated, isAuthenticated, session?.access_token, fetchItems, subscribe, unsubscribe, resetMenu]);

  const authReady = hydrated && authStatus !== "loading" && authStatus !== "idle";
  const showInitialMenuLoading = loading && items.length === 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />

        <View className="mb-10">
          <Text className={`font-outfit text-4xl md:text-6xl font-black tracking-tight ${cx.textInk}`}>
            {config.title}
          </Text>
          <Text className={`font-outfit mt-4 max-w-2xl text-base md:text-lg leading-relaxed ${cx.textInk70}`}>
            {config.description}
          </Text>
        </View>

        {!authReady ? (
          <CircularProgress message="Checking your session..." />
        ) : !isAuthenticated ? (
          <Alert variant="info" message="Sign in to view the menu." />
        ) : (
          <>
            <View className="mb-4 flex-row items-end justify-between">
              <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Menu</Text>
              <View className="flex-row items-center gap-2">
                {syncing && !loading ? <CircularProgress size="small" /> : null}
                <Text className={`font-outfit text-sm ${cx.textInk50}`}>
                  {loading ? "Loading..." : syncing ? "Updating..." : `${items.length} items`}
                </Text>
              </View>
            </View>

            {error ? <Alert variant="error" message={error} /> : null}

            {showInitialMenuLoading ? (
              <CircularProgress message="Loading menu items..." />
            ) : null}

            {!loading && !error && items.length === 0 ? (
              <Alert variant="info" message="No menu items are available right now." />
            ) : null}

            {items.length > 0 ? (
              <View className={`mt-4 gap-4 ${syncing ? "opacity-80" : "opacity-100"}`}>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 md:p-6`}
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1">
                        <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>
                          {item.name}
                        </Text>
                        {item.description ? (
                          <Text className={`font-outfit mt-2 text-sm md:text-base leading-relaxed ${cx.textInk70}`}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text className={`font-outfit text-lg font-bold ${cx.textPrimary}`}>
                        {formatPrice(item.price_cents)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
