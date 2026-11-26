import { useEffect, useMemo } from "react";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { StatGrid } from "../../components/stat-grid.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useItemsStore } from "../../stores/items.store.js";
import { useOrdersStore } from "../../stores/orders.store.js";
import { useAuditLogsStore } from "../../stores/audit-logs.store.js";
import { useProfilesStore } from "../../stores/profiles.store.js";
import { formatCurrencyCents } from "../../format/currency.js";
import { cx } from "../../constants/theme.js";

/**
 * Administrator dashboard with live counts and audit navigation.
 * @module screens/admin/admin.screen
 */

/**
 * @returns {JSX.Element} Admin dashboard.
 */
export default function AdminScreen() {
  const session = useAuthStore((s) => s.session);

  const items = useItemsStore((s) => s.items);
  const itemsLoading = useItemsStore((s) => s.loading);
  const fetchItems = useItemsStore((s) => s.fetchItems);
  const subscribeItems = useItemsStore((s) => s.subscribe);

  const orders = useOrdersStore((s) => s.adminOrders);
  const ordersLoading = useOrdersStore((s) => s.loading);
  const fetchAdminOrders = useOrdersStore((s) => s.fetchAdminOrders);
  const subscribeAdminOrders = useOrdersStore((s) => s.subscribeAdmin);
  const unsubscribeOrders = useOrdersStore((s) => s.unsubscribe);

  const auditLogs = useAuditLogsStore((s) => s.logs);
  const auditLoading = useAuditLogsStore((s) => s.loading);
  const fetchAuditLogs = useAuditLogsStore((s) => s.fetchLogs);
  const subscribeAuditLogs = useAuditLogsStore((s) => s.subscribe);

  const profiles = useProfilesStore((s) => s.profiles);
  const profilesLoading = useProfilesStore((s) => s.loading);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribeProfiles = useProfilesStore((s) => s.subscribe);

  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    void fetchItems().catch(() => {});
    void fetchAdminOrders(token).catch(() => {});
    void fetchAuditLogs(token).catch(() => {});
    void fetchProfiles(token).catch(() => {});
    subscribeItems();
    subscribeAdminOrders(token);
    subscribeAuditLogs(token);
    subscribeProfiles(token);
    return () => {
      void unsubscribeOrders();
      void useAuditLogsStore.getState().unsubscribe();
      void useProfilesStore.getState().unsubscribe();
    };
  }, [token, fetchItems, fetchAdminOrders, fetchAuditLogs, fetchProfiles, subscribeItems, subscribeAdminOrders, subscribeAuditLogs, subscribeProfiles, unsubscribeOrders]);

  const itemsStats = useMemo(() => {
    const total = items.length;
    const available = items.filter((item) => item.is_available).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [items]);

  const profilesStats = useMemo(() => ({
    total: profiles.length,
    active: profiles.filter((p) => p.is_active !== false).length,
    admins: profiles.filter((p) => p.role === "admin").length
  }), [profiles]);

  const ordersStats = useMemo(() => {
    const paid = orders.filter((t) => t.status === "Paid");
    return {
      total: orders.length,
      paid: paid.length,
      amountCents: paid.reduce((sum, t) => sum + Number(t.total_cents || 0), 0)
    };
  }, [orders]);

  const itemsCountLoading = itemsLoading && items.length === 0;
  const ordersCountLoading = ordersLoading && orders.length === 0;

  const cards = [
    {
      key: "menu",
      title: "Items",
      href: "/admin/items",
      linkLabel: "Open items audit →",
      stats: [
        { label: "Total items", value: itemsStats.total, loading: itemsCountLoading },
        { label: "Available", value: itemsStats.available, loading: itemsCountLoading },
        { label: "Unavailable", value: itemsStats.unavailable, loading: itemsCountLoading }
      ]
    },
    {
      key: "profiles",
      title: "Profiles",
      href: "/admin/profiles",
      linkLabel: "Open profiles audit →",
      stats: [
        { label: "Total", value: profilesStats.total, loading: profilesLoading && profiles.length === 0 },
        { label: "Active", value: profilesStats.active, loading: profilesLoading && profiles.length === 0 },
        { label: "Admins", value: profilesStats.admins, loading: profilesLoading && profiles.length === 0 }
      ]
    },
    {
      key: "audit",
      title: "Audit logs",
      href: "/admin/audit-logs",
      linkLabel: "Open audit logs →",
      stats: [
        { label: "Events", value: auditLogs.length, loading: auditLoading && auditLogs.length === 0 }
      ]
    },
    {
      key: "orders",
      title: "Orders",
      href: "/admin/orders",
      linkLabel: "Open orders →",
      stats: [
        { label: "Total", value: ordersStats.total, loading: ordersCountLoading },
        { label: "Paid", value: ordersStats.paid, loading: ordersCountLoading },
        { label: "Paid amount", value: formatCurrencyCents(ordersStats.amountCents), loading: ordersCountLoading }
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
          Live operational overview across items, orders, profiles, and audit logs.
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
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={card.linkLabel}
                    className="min-h-[44px] items-center justify-center"
                  >
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
