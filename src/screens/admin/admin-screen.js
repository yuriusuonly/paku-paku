import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { cx } from "../../shared/theme.js";

/**
 * Administrator dashboard with links to management screens.
 * @module screens/admin/admin-screen
 */

/**
 * @returns {JSX.Element} Admin dashboard.
 */
export default function AdminScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const isAdmin = status === "authenticated" && user?.role === "admin";

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-8">
          <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Administration</Text>
          <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
            Signed in as <Text className="font-semibold">{user.username}</Text>. Admin-only management and audit screens.
          </Text>
        </View>

        <View className="gap-4">
          <Link href="/admin/menu-items" asChild>
            <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
              <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Menu items management</Text>
              <Text className={`font-outfit mt-2 text-sm ${cx.textInk70}`}>View, create, update, and delete menu items. Changes sync bidirectionally.</Text>
            </View>
          </Link>
          <Link href="/admin/profiles" asChild>
            <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
              <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Profiles management</Text>
              <Text className={`font-outfit mt-2 text-sm ${cx.textInk70}`}>Audit and manage user profiles. Only one admin account is allowed.</Text>
            </View>
          </Link>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
