import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button } from "../components/button.js";
import { Header } from "../components/header.js";
import { ScreenContainer } from "../components/container.js";
import { useAuthStore } from "../stores/auth-store.js";

/**
 * Administrator dashboard with links to management screens.
 * @module screens/admin/index
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
      <ScreenContainer className="items-center justify-center">
        <Text className="font-outfit text-base text-[#161823]/70">Checking access...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-8">
          <Text className="font-outfit text-3xl font-black tracking-tight text-[#161823]">Administration</Text>
          <Text className="font-outfit mt-2 text-base text-[#161823]/70">
            Signed in as <Text className="font-semibold">{user.username}</Text>. Admin-only management and audit screens.
          </Text>
        </View>

        <View className="gap-4">
          <Link href="/admin/menu-items" asChild>
            <View className="rounded-3xl border border-[#161823]/10 bg-[#161823]/[0.02] p-5">
              <Text className="font-outfit text-xl font-bold text-[#161823]">Menu items management</Text>
              <Text className="font-outfit mt-2 text-sm text-[#161823]/70">View, create, update, and delete menu items. Changes sync bidirectionally.</Text>
            </View>
          </Link>
          <Link href="/admin/profiles" asChild>
            <View className="rounded-3xl border border-[#161823]/10 bg-[#161823]/[0.02] p-5">
              <Text className="font-outfit text-xl font-bold text-[#161823]">Profiles management</Text>
              <Text className="font-outfit mt-2 text-sm text-[#161823]/70">Audit and manage user profiles. Only one admin account is allowed.</Text>
            </View>
          </Link>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
