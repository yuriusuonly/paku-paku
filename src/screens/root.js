import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import logo from "../../png/logo.png";
import { Alert } from "../components/alert.js";
import { EmptyState } from "../components/empty-state.js";
import { Header } from "../components/header.js";
import { CircularProgress } from "../components/circular-progress.js";
import { ScreenContainer } from "../components/container.js";
import config from "../shared/constants/config.js";
import { useAuthStore } from "../stores/auth-store.js";
import { useMenuStore } from "../stores/menu-store.js";
import { cx } from "../shared/constants/theme.js";

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
  const visibleItems = items.filter((item) => item?.is_available !== false);
  const showInitialMenuLoading = loading && visibleItems.length === 0;

  const showMenuSection = authReady && isAuthenticated;

  if (showMenuSection) {
    return (
      <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />

        <View className="mb-4 flex-row items-end justify-between">
          <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Menu</Text>
          {loading || syncing ? (
            <CircularProgress size="small" />
          ) : (
            <Text className={`font-outfit text-sm ${cx.textInk50}`}>{visibleItems.length} items</Text>
          )}
        </View>

        {error ? <Alert variant="error" message={error} /> : null}

        {showInitialMenuLoading ? (
          <CircularProgress message="Loading menu items..." />
        ) : null}

        {!loading && !error && visibleItems.length === 0 ? (
          <EmptyState message="No menu items are available right now." />
        ) : null}

        {visibleItems.length > 0 ? (
          <View className={`mt-4 gap-4 ${syncing ? "opacity-80" : "opacity-100"}`}>
            {visibleItems.map((item) => (
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <View className="w-full flex-1 items-center justify-center py-2">
        <View className="w-full flex-col-reverse items-stretch gap-2 md:flex-row md:items-center md:gap-8">
          <View className="w-full items-center justify-start text-center md:flex-1 md:items-start md:justify-center md:text-left">
            <Text className={`font-outfit text-center text-4xl md:text-left md:text-6xl font-black tracking-tight ${cx.textInk}`}>
              {config.title}
            </Text>
            <Text className={`font-outfit mt-4 max-w-2xl text-center text-base md:text-left md:text-lg leading-relaxed ${cx.textInk70}`}>
              {config.description}
            </Text>
          </View>
          <View className="w-full items-center justify-end md:flex-1 md:justify-center">
            <Image
              source={logo}
              accessibilityLabel={`${config.title} logo`}
              resizeMode="contain"
              className="max-h-40 max-w-full md:max-h-80"
              style={{ objectFit: "contain", objectPosition: "50% 50%" }}
            />
          </View>
        </View>
      </View>

      {!authReady ? (
        <CircularProgress message="Checking your session..." />
      ) : null}
    </ScreenContainer>
  );
}
