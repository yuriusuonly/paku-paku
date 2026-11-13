import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../components/alert.js";
import { Button } from "../components/button.js";
import { Header } from "../components/header.js";
import { ScreenContainer } from "../components/container.js";
import { getProfiles } from "../services/admin.js";
import { useAuthStore } from "../stores/auth-store.js";

/**
 * Admin profiles management/audit screen.
 * @module screens/admin/profiles
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

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = status === "authenticated" && user?.role === "admin";

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !session?.access_token) return;
    let active = true;
    setLoading(true);
    getProfiles(session.access_token)
      .then((data) => { if (active) { setProfiles(data.profiles || []); setError(""); } })
      .catch((err) => { if (active) setError(err?.message || "Could not load profiles."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [hydrated, isAdmin, session?.access_token]);

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
        <View className="mb-6 flex-row items-end justify-between">
          <View>
            <Text className="font-outfit text-3xl font-black tracking-tight text-[#161823]">Profiles management</Text>
            <Text className="font-outfit mt-2 text-base text-[#161823]/70">Admin-only audit and management view. Only one admin account is allowed.</Text>
          </View>
          <Link href="/admin" asChild><Button label="Back" variant="ghost" /></Link>
        </View>

        <Alert variant="error" message={error} />

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-outfit text-xl font-bold text-[#161823]">Profiles</Text>
          <Text className="font-outfit text-sm text-[#161823]/50">{loading ? "Loading..." : `${profiles.length} total`}</Text>
        </View>

        <View className="gap-3">
          {profiles.map((profile) => (
            <View key={profile.id} className="flex-row items-center justify-between rounded-2xl border border-[#161823]/10 bg-[#161823]/[0.02] px-4 py-4">
              <View>
                <Text className="font-outfit text-base font-bold text-[#161823]">{profile.username}</Text>
                <Text className="font-outfit mt-1 text-xs text-[#161823]/50">{profile.id}</Text>
                <Text className="font-outfit mt-1 text-xs text-[#161823]/50">Created: {profile.created_at || "-"}</Text>
              </View>
              <View className={`rounded-full px-3 py-1 ${profile.role === "admin" ? "bg-[#FE2C55]/10" : "bg-[#161823]/5"}`}>
                <Text className={`font-outfit text-xs font-semibold uppercase ${profile.role === "admin" ? "text-[#FE2C55]" : "text-[#161823]/70"}`}>{profile.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
