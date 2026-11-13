import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useProfilesStore } from "../../../stores/profiles-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin profiles management/audit screen.
 * @module screens/admin/profiles/profiles-screen
 */

/**
 * @returns {JSX.Element} Admin profiles screen.
 */
export default function AdminProfilesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const profiles = useProfilesStore((s) => s.profiles);
  const loading = useProfilesStore((s) => s.loading);
  const syncing = useProfilesStore((s) => s.syncing);
  const error = useProfilesStore((s) => s.error);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribe = useProfilesStore((s) => s.subscribe);
  const unsubscribe = useProfilesStore((s) => s.unsubscribe);

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchProfiles(token).catch(() => {});
    subscribe();
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchProfiles, subscribe, unsubscribe]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const showInitialLoading = loading && profiles.length === 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-6 flex-row items-end justify-between">
          <View>
            <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Profiles management</Text>
            <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Profile data stays reactive and syncs in real time when changes occur.</Text>
          </View>
          <Link href="/admin" asChild><Button label="Back" variant="ghost" /></Link>
        </View>

        <Alert variant="error" message={error} />

        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Profiles</Text>
            {syncing ? <CircularProgress size="small" /> : null}
          </View>
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>
            {loading ? "Loading..." : syncing ? "Syncing changes..." : `${profiles.length} total`}
          </Text>
        </View>

        {showInitialLoading ? <CircularProgress message="Loading profiles..." /> : null}

        {!loading && !error && profiles.length === 0 ? (
          <Alert variant="info" message="No profiles found." />
        ) : null}

        {profiles.length > 0 ? (
          <View className={`gap-3 ${syncing ? "opacity-80" : "opacity-100"}`}>
            {profiles.map((profile) => (
              <View key={profile.id} className={`flex-row items-center justify-between rounded-2xl border ${cx.borderSubtle} ${cx.bgSurface} px-4 py-4`}>
                <View>
                  <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>{profile.username}</Text>
                  <Text className={`font-outfit mt-1 text-xs ${cx.textInk50}`}>{profile.id}</Text>
                  <Text className={`font-outfit mt-1 text-xs ${cx.textInk50}`}>Created: {profile.created_at || "-"}</Text>
                </View>
                <View className={`rounded-full px-3 py-1 ${profile.role === "admin" ? "${cx.bgPrimarySoft}" : "${cx.bgSurfaceMuted}"}`}>
                  <Text className={`font-outfit text-xs font-semibold uppercase ${profile.role === "admin" ? "${cx.textPrimary}" : "${cx.textInk70}"}`}>{profile.role}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
