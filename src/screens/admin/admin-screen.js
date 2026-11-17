import { useEffect, useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { StatGrid } from "../../components/stat-grid.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useMenuStore } from "../../stores/menu-store.js";
import { useProfilesStore } from "../../stores/profiles-store.js";
import { useTransactionsStore } from "../../stores/transactions-store.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Administrator dashboard with live counts and audit navigation.
 * @module screens/admin/admin-screen
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

  const profiles = useProfilesStore((s) => s.profiles);
  const profilesLoading = useProfilesStore((s) => s.loading);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribeProfiles = useProfilesStore((s) => s.subscribe);


  const transactions = useTransactionsStore((s) => s.adminTransactions);
  const transactionsLoading = useTransactionsStore((s) => s.loading);
  const fetchAdminTransactions = useTransactionsStore((s) => s.fetchAdminTransactions);
  const subscribeAdminTransactions = useTransactionsStore((s) => s.subscribeAdmin);
  const unsubscribeTransactions = useTransactionsStore((s) => s.unsubscribe);

  const isAdmin = status === "authenticated" && authUser?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchMenuItems(token).catch(() => {});
    void fetchProfiles(token).catch(() => {});
    void fetchAdminTransactions(token).catch(() => {});
    subscribeMenu(token);
    subscribeProfiles(token);
    subscribeAdminTransactions(token);
    return () => {
      void unsubscribeTransactions();
    };
  }, [hydrated, isAdmin, token, fetchMenuItems, fetchProfiles, fetchInventory, fetchAdminTransactions, subscribeMenu, subscribeProfiles, subscribeAdminTransactions, unsubscribeTransactions]);

  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((item) => item.is_available).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [menuItems]);

  const profileStats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((profile) => profile.is_active !== false).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [profiles]);

  const transactionsStats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    return {
      total: transactions.length,
      buy: transactions.filter((t) => t.kind === "buy").length,
      sell: transactions.filter((t) => t.kind === "sell").length,
      completed: completed.length,
      amountCents: completed.reduce((sum, t) => sum + Number(t.total_cents || 0), 0)
    };
  }, [transactions]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const menuCountLoading = menuLoading && menuItems.length === 0;
  const profileCountLoading = profilesLoading && profiles.length === 0;
  const transactionsCountLoading = transactionsLoading && transactions.length === 0;

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
      key: "transactions",
      title: "Transactions",
      href: "/admin/transactions",
      linkLabel: "Open transactions →",
      stats: [
        { label: "Total", value: transactionsStats.total, loading: transactionsCountLoading },
        { label: "Buy", value: transactionsStats.buy, loading: transactionsCountLoading },
        { label: "Sell", value: transactionsStats.sell, loading: transactionsCountLoading },
        { label: "Completed amount", value: formatCurrencyCents(transactionsStats.amountCents), loading: transactionsCountLoading }
      ]
    },
    {
      key: "profiles",
      title: "Profiles",
      href: "/admin/profiles",
      linkLabel: "Open profiles audit →",
      stats: [
        { label: "Total profiles", value: profileStats.total, loading: profileCountLoading },
        { label: "Active", value: profileStats.active, loading: profileCountLoading },
        { label: "Inactive", value: profileStats.inactive, loading: profileCountLoading }
      ]
    }
  ];

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6 sm:mb-8 md:mb-10">
        <Text className={`font-outfit text-xl font-black tracking-tight sm:text-2xl md:text-3xl ${cx.textInk}`}>
          Administration dashboard
        </Text>
        <Text className={`font-outfit mt-2 text-sm sm:mt-3 sm:text-base ${cx.textInk70}`}>
          Live operational overview across menu, transactions, and profiles.
        </Text>
      </View>

      <View className="-mx-2 flex-row flex-wrap sm:-mx-3 md:-mx-4">
        {cards.map((card) => (
          <View key={card.key} className="w-full p-2 sm:p-3 md:w-1/2 md:p-4">
            <View className={`h-full rounded-2xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 sm:rounded-3xl sm:p-6 md:p-7`}>
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
