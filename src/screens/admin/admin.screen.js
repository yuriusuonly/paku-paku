import { useEffect, useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { StatGrid } from "../../components/stat-grid.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useMenuStore } from "../../stores/menu.store.js";
import { useOrdersStore } from "../../stores/orders.store.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Administrator dashboard with live counts and audit navigation.
 * @module screens/admin/admin.screen
 */

/**
 * @returns {JSX.Element} Admin dashboard.
 */
export default function AdminScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const menuItems = useMenuStore((s) => s.items);
  const menuLoading = useMenuStore((s) => s.loading);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);
  const subscribeMenu = useMenuStore((s) => s.subscribe);

  const orders = useOrdersStore((s) => s.adminOrders);
  const ordersLoading = useOrdersStore((s) => s.loading);
  const fetchAdminOrders = useOrdersStore((s) => s.fetchAdminOrders);
  const subscribeAdminOrders = useOrdersStore((s) => s.subscribeAdmin);
  const unsubscribeOrders = useOrdersStore((s) => s.unsubscribe);

  const isAdmin = status === "authenticated" && authUser?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace("/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchMenuItems().catch(() => {});
    void fetchAdminOrders(token).catch(() => {});
    subscribeMenu();
    subscribeAdminOrders(token);
    return () => {
      void unsubscribeOrders();
    };
  }, [hydrated, isAdmin, token, fetchMenuItems, fetchAdminOrders, subscribeMenu, subscribeAdminOrders, unsubscribeOrders]);

  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((item) => item.is_available).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [menuItems]);

  const ordersStats = useMemo(() => {
    const completed = orders.filter((t) => t.status === "completed");
    return {
      total: orders.length,
      buy: orders.filter((t) => t.kind === "buy").length,
      sell: orders.filter((t) => t.kind === "sell").length,
      completed: completed.length,
      amountCents: completed.reduce((sum, t) => sum + Number(t.total_cents || 0), 0)
    };
  }, [orders]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const menuCountLoading = menuLoading && menuItems.length === 0;
  const ordersCountLoading = ordersLoading && orders.length === 0;

  const cards = [
    {
      key: "menu",
      title: "Menu items",
      href: "/admin/menu-items",
      linkLabel: "Open menu items audit →",
      stats: [
        { label: "Total items", value: menuStats.total, loading: menuCountLoading },
        { label: "Available", value: menuStats.available, loading: menuCountLoading },
        { label: "Unavailable", value: menuStats.unavailable, loading: menuCountLoading }
      ]
    },
    {
      key: "orders",
      title: "Orders",
      href: "/admin/orders",
      linkLabel: "Open orders →",
      stats: [
        { label: "Total", value: ordersStats.total, loading: ordersCountLoading },
        { label: "Buy", value: ordersStats.buy, loading: ordersCountLoading },
        { label: "Sell", value: ordersStats.sell, loading: ordersCountLoading },
        { label: "Completed amount", value: formatCurrencyCents(ordersStats.amountCents), loading: ordersCountLoading }
      ]
    },
  ];

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6 sm:mb-8 md:mb-10">
        <Text className={`${cx.typography.title} ${cx.textInk}`}>
          Administration dashboard
        </Text>
        <Text className={`font-outfit mt-2 text-sm sm:mt-3 sm:text-base ${cx.textInk70}`}>
          Live operational overview across menu and orders.
        </Text>
      </View>

      <View className="-mx-2 flex-row flex-wrap sm:-mx-3 md:-mx-4">
        {cards.map((card) => (
          <View key={card.key} className="w-full p-2 sm:p-3 md:w-1/2 md:p-4">
            <View className={`h-full ${cx.layout.card} ${cx.spacing.cardPad}`}>
              <View className="mb-4 sm:mb-5">
                <Text className={`font-outfit text-lg font-bold sm:text-xl md:text-2xl ${cx.textInk}`}>
                  {card.title}
                </Text>
              </View>
              <StatGrid stats={card.stats} className="mb-0" />
              <View className="mt-5 items-start sm:mt-6 md:mt-8">
                <Link href={card.href} asChild>
                  <Pressable>
                    <Text className={`font-outfit text-xs font-semibold sm:text-sm ${cx.textPrimary}`}>
                      {card.linkLabel}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
