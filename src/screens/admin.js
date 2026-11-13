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
 * Administrator screen for viewing profiles.
 * @module screens/admin
 */

/**
 * Protected admin screen.
 *
 * @returns {JSX.Element} Admin screen.
 */
export default function AdminScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const status = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = status === "authenticated" && user?.role === "admin";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAdmin) {
      router.replace(status === "authenticated" ? "/" : "/sign-in");
    }
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !session?.access_token) {
      return;
    }

    let active = true;
    setLoading(true);

    getProfiles(session.access_token)
      .then((data) => {
        if (active) {
          setProfiles(data.profiles || []);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || "Could not load profiles.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [hydrated, isAdmin, session]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="font-outfit text-base text-[#161823]/70">
          Checking access...
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />

        <View className="mb-8 flex-row items-end justify-between">
          <View>
            <Text className="font-outfit text-3xl font-black tracking-tight text-[#161823]">
              Administration
            </Text>
            <Text className="font-outfit mt-2 text-base text-[#161823]/70">
              Signed in as <Text className="font-semibold">{user.username}</Text>
            </Text>
          </View>
          <Link href="/" asChild>
            <Button label="Back to menu" variant="ghost" />
          </Link>
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-outfit text-xl font-bold text-[#161823]">
            Profiles
          </Text>
          <Text className="font-outfit text-sm text-[#161823]/50">
            {loading ? "Loading..." : `${profiles.length} total`}
          </Text>
        </View>

        {error ? <Alert variant="error" message={error} /> : null}

        <View className="mt-4 gap-3">
          {profiles.map((profile) => (
            <View
              key={profile.id}
              className="flex-row items-center justify-between rounded-2xl border border-[#161823]/10 bg-[#161823]/[0.02] px-4 py-4"
            >
              <View>
                <Text className="font-outfit text-base font-bold text-[#161823]">
                  {profile.username}
                </Text>
                <Text className="font-outfit mt-1 text-xs text-[#161823]/50">
                  {profile.id}
                </Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${profile.role === "admin" ? "bg-[#FE2C55]/10" : "bg-[#161823]/5"}`}
              >
                <Text
                  className={`font-outfit text-xs font-semibold uppercase ${profile.role === "admin" ? "text-[#FE2C55]" : "text-[#161823]/70"}`}
                >
                  {profile.role}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
