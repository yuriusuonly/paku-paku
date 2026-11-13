import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth-store.js";
import config from "../shared/config.js";

/**
 * Site header with navigation and auth actions.
 * @module components/header
 */

/**
 * Top navigation bar.
 *
 * @returns {JSX.Element} Header element.
 */
export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);

  const onSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <View className="mb-10 flex-row items-center justify-between">
      <Link href="/" asChild>
        <Pressable>
          <Text className="font-outfit text-xl font-black tracking-tight text-[#161823]">
            {config.title}
          </Text>
        </Pressable>
      </Link>

      <View className="flex-row items-center gap-3">
        {status === "authenticated" && user ? (
          <>
            {user.role === "admin" ? (
              <Link href="/admin" asChild>
                <Pressable className="rounded-full bg-[#161823]/5 px-4 py-2">
                  <Text className="font-outfit text-sm font-semibold text-[#161823]">
                    Admin
                  </Text>
                </Pressable>
              </Link>
            ) : null}
            <Pressable
              onPress={onSignOut}
              className="rounded-full bg-[#161823] px-4 py-2"
            >
              <Text className="font-outfit text-sm font-semibold text-white">
                Sign out
              </Text>
            </Pressable>
          </>
        ) : (
          <Link href="/sign-in" asChild>
            <Pressable className="rounded-full bg-[#FE2C55] px-4 py-2">
              <Text className="font-outfit text-sm font-semibold text-white">
                Sign in
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
