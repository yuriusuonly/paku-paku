import { useEffect, useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useMenuStore } from "../../stores/menu-store.js";
import { useProfilesStore } from "../../stores/profiles-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Administrator dashboard with live counts and links to management screens.
 * @module screens/admin/admin-screen
 */

/**
 * Clickable dashboard stat card.
 *
 * @param {{href: string, label: string, value: string | number, hint?: string, loading?: boolean}} props
 * @returns {JSX.Element}
 */
function StatCard({ href, label, value, hint, loading = false }) {
  return (
    <Link href={href} asChild>
      <Pressable className={`flex-1 min-w-[180px] rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
        <Text className={`font-outfit text-sm font-semibold uppercase tracking-wide ${cx.textInk60}`}>
          {label}
        </Text>
        <View className="mt-3 flex-row items-end justify-between">
          <Text className={`font-outfit text-4xl font-black tracking-tight ${cx.textInk}`}>
            {loading ? "—" : value}
          </Text>
          {loading ? <CircularProgress size="small" /> : null}
        </View>
        {hint ? (
          <Text className={`font-outfit mt-2 text-sm ${cx.textInk70}`}>{hint}</Text>
        ) : null}
        <Text className={`font-outfit mt-4 text-sm font-semibold ${cx.textPrimary}`}>
          Open audit →
        </Text>
      </Pressable>
    </Link>
  );
}

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
  const menuSyncing = useMenuStore((s) => s.syncing);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);
  const subscribeMenu = useMenuStore((s) => s.subscribe);

  const profiles = useProfilesStore((s) => s.profiles);
  const profilesLoading = useProfilesStore((s) => s.loading);
  const profilesSyncing = useProfilesStore((s) => s.syncing);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribeProfiles = useProfilesStore((s) => s.subscribe);

  const isAdmin = status === "authenticated" && authUser?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchMenuItems(token).catch(() => {});
    void fetchProfiles(token).catch(() => {});
    subscribeMenu(token);
    subscribeProfiles();
  }, [hydrated, isAdmin, token, fetchMenuItems, fetchProfiles, subscribeMenu, subscribeProfiles]);

  const menuStats = useMemo(() => {
    const total = menuItems.length;
    const available = menuItems.filter((item) => item.is_available).length;
    const hidden = total - available;
    return { total, available, hidden };
  }, [menuItems]);

  const profileStats = useMemo(() => {
    const total = profiles.length;
    const active = profiles.filter((profile) => profile.is_active !== false).length;
    const inactive = total - active;
    const admins = profiles.filter((profile) => profile.role === "admin").length;
    const customers = total - admins;
    return { total, active, inactive, admins, customers };
  }, [profiles]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const menuBusy = menuLoading || menuSyncing;
  const profilesBusy = profilesLoading || profilesSyncing;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-8">
          <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Administration dashboard</Text>
          <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
            Signed in as <Text className="font-semibold">{authUser.username}</Text>. Live overview of menu items and profiles.
          </Text>
        </View>

        <View className="mb-10">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Menu items</Text>
              <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                Manage menu items, availability, ordering, and details.
              </Text>
            </View>
            {menuBusy ? <Text className={`font-outfit text-sm ${cx.textInk50}`}>Syncing…</Text> : null}
          </View>
          <View className="flex-row flex-wrap gap-4">
            <StatCard
              href="/admin/menu-items"
              label="Total items"
              value={menuStats.total}
              hint="All menu items in the database"
              loading={menuLoading && menuItems.length === 0}
            />
            <StatCard
              href="/admin/menu-items"
              label="Available"
              value={menuStats.available}
              hint="Visible/available to customers"
              loading={menuLoading && menuItems.length === 0}
            />
            <StatCard
              href="/admin/menu-items"
              label="Hidden"
              value={menuStats.hidden}
              hint="Unavailable or hidden items"
              loading={menuLoading && menuItems.length === 0}
            />
          </View>
        </View>

        <View>
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Profiles</Text>
              <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                Audit user profiles, roles, and active status.
              </Text>
            </View>
            {profilesBusy ? <Text className={`font-outfit text-sm ${cx.textInk50}`}>Syncing…</Text> : null}
          </View>
          <View className="flex-row flex-wrap gap-4">
            <StatCard
              href="/admin/profiles"
              label="Total profiles"
              value={profileStats.total}
              hint="All user profiles"
              loading={profilesLoading && profiles.length === 0}
            />
            <StatCard
              href="/admin/profiles"
              label="Active"
              value={profileStats.active}
              hint="Profiles allowed to sign in"
              loading={profilesLoading && profiles.length === 0}
            />
            <StatCard
              href="/admin/profiles"
              label="Inactive"
              value={profileStats.inactive}
              hint="Soft-deleted/disabled profiles"
              loading={profilesLoading && profiles.length === 0}
            />
            <StatCard
              href="/admin/profiles"
              label="Customers"
              value={profileStats.customers}
              hint="Customer-role profiles"
              loading={profilesLoading && profiles.length === 0}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
