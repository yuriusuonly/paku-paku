import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { EmptyState } from "../../components/empty-state.js";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useCartStore } from "../../stores/cart-store.js";
import { useMenuStore } from "../../stores/menu-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Authenticated menu screen.
 * @module screens/menu/menu-screen
 */

/**
 * Formats a price in cents as a currency string.
 *
 * @param {number} cents - Price in cents.
 * @returns {string} Formatted price.
 */
function formatPrice(cents) {
  return `₱${(Number(cents || 0) / 100).toFixed(2)}`;
}

/**
 * Menu screen component.
 *
 * @returns {JSX.Element} Menu screen.
 */
export default function MenuScreen() {
  const router = useRouter();
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

  const hydrateCart = useCartStore((state) => state.hydrate);
  const addToCart = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0));
  const showSuccess = useNotificationStore((state) => state.showSuccess);

  const isAuthenticated = authStatus === "authenticated" && Boolean(user && session?.access_token);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && user?.id) hydrateCart(user.id);
  }, [hydrated, user?.id, hydrateCart]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (authStatus === "unauthenticated" || !session?.access_token || !user) {
      router.replace("/");
    }
  }, [hydrated, authStatus, session?.access_token, user, router]);

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
  const beverageItems = visibleItems.filter((item) => Number(item?.sort_order ?? 0) < 150);
  const foodItems = visibleItems.filter((item) => Number(item?.sort_order ?? 0) >= 150);
  const menuSections = [
    { key: "food", title: "Food", items: foodItems },
    { key: "beverage", title: "Beverage", items: beverageItems }
  ].filter((section) => section.items.length > 0);
  const showInitialMenuLoading = loading && visibleItems.length === 0;

  if (!authReady || !isAuthenticated) {
    return (
      <ScreenContainer>
        <Header />
        <CircularProgress message={!authReady ? "Checking your session..." : "Redirecting..."} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <View className="mb-4 flex-row items-end justify-between">
        <View>
          <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Menu</Text>
          {user?.role !== "admin" ? (
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              Add items to your cart, then place an order. Cart: {cartCount}
            </Text>
          ) : null}
        </View>
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

      {menuSections.length > 0 ? (
        <View className={`mt-4 gap-8 ${syncing ? "opacity-80" : "opacity-100"}`}>
          {menuSections.map((section) => (
            <View key={section.key}>
              <Text className={`font-outfit mb-3 text-xl font-black tracking-tight ${cx.textInk}`}>
                {section.title}
              </Text>
              <View className="-mx-2 flex-row flex-wrap">
                {section.items.map((item) => (
                  <View key={item.id} className="w-full p-2 md:w-1/2 lg:w-1/3">
                    <View className={`h-full rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 md:p-6`}>
                      <View className="flex-1 flex-row items-start justify-between gap-4">
                        <View className="flex-1">
                          <View className="flex-row flex-wrap items-center gap-2">
                            <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>
                              {item.name}
                            </Text>
                            {item.is_best_seller ? (
                              <View className={`rounded-full ${cx.bgPrimarySoft} px-2.5 py-1`}>
                                <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textPrimary}`}>
                                  Best seller
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {item.description ? (
                            <Text className={`font-outfit mt-2 text-sm md:text-base leading-relaxed ${cx.textInk70}`}>
                              {item.description}
                            </Text>
                          ) : null}
                        </View>
                        <View className="items-end gap-2">
                          <Text className={`font-outfit text-lg font-bold ${cx.textPrimary}`}>
                            {formatPrice(item.price_cents)}
                          </Text>
                          {user?.role !== "admin" ? (
                            <Button
                              label="Add to cart"
                              variant="secondary"
                              onPress={() => {
                                addToCart({
                                  menu_item_id: item.id,
                                  item_name: item.name,
                                  unit_price_cents: Number(item.price_cents || 0),
                                  quantity: 1
                                });
                                showSuccess(`${item.name} added to cart.`);
                              }}
                            />
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
