import { useEffect, useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useMenuStore } from "../../stores/menu-store.js";
import { useProfilesStore } from "../../stores/profiles-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Administrator dashboard with live counts and audit navigation.
 * @module screens/admin/admin-screen
 */

/**
 * Small stat display inside a dashboard card.
 *
 * @param {{label: string, value: string | number, loading?: boolean}} props
 * @returns {JSX.Element}
 */
function StatItem({ label, value, loading = false }) {
  return (
    <View className="min-w-[140px] flex-1">
      <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>
        {label}
      </Text>
      <View className="mt-2 min-h-[36px] flex-row items-center">
        {loading ? (
          <CircularProgress size="small" />
        ) : (
          <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>
            {value}
          </Text>
        )}
      </View>
    </View>
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
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);
  const subscribeMenu = useMenuStore((s) => s.subscribe);

  const profiles = useProfilesStore((s) => s.profiles);
  const profilesLoading = useProfilesStore((s) => s.loading);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribeProfiles = useProfilesStore((s) => s.subscribe);

  const isAdmin = status === "authenticated" && authUser?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchMenuItems(token).catch(() => {});
    void fetchProfiles(token).catch(() => {});
    subscribeMenu(token);
    subscribeProfiles(token);
  }, [hydrated, isAdmin, token, fetchMenuItems, fetchProfiles, subscribeMenu, subscribeProfiles]);

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

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const menuCountLoading = menuLoading && menuItems.length === 0;
  const profileCountLoading = profilesLoading && profiles.length === 0;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-8">
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Administration dashboard</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Signed in as <Text className="font-semibold">{authUser.username}</Text>. Live overview of menu items and profiles.
        </Text>
      </View>

      <View className="gap-6">
        <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-6`}>
          <View className="mb-4">
            <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Menu items</Text>
          </View>
          <View className="flex-row flex-wrap gap-x-6 gap-y-4">
            <StatItem label="Total items" value={menuStats.total} loading={menuCountLoading} />
            <StatItem label="Available" value={menuStats.available} loading={menuCountLoading} />
            <StatItem label="Unavailable" value={menuStats.unavailable} loading={menuCountLoading} />
          </View>
          <View className="mt-6">
            <Link href="/admin/menu-items" asChild>
              <Pressable>
                <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Open menu items audit →</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-6`}>
          <View className="mb-4">
            <Text className={`font-outfit text-2xl font-bold ${cx.textInk}`}>Profiles</Text>
          </View>
          <View className="flex-row flex-wrap gap-x-6 gap-y-4">
            <StatItem label="Total profiles" value={profileStats.total} loading={profileCountLoading} />
            <StatItem label="Active" value={profileStats.active} loading={profileCountLoading} />
            <StatItem label="Inactive" value={profileStats.inactive} loading={profileCountLoading} />
          </View>
          <View className="mt-6">
            <Link href="/admin/profiles" asChild>
              <Pressable>
                <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Open profiles audit →</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
