import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth-store.js";
import config from "../shared/constants/config.js";
import { cx } from "../shared/constants/theme.js";

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
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);

  const onSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const isAdminPage = typeof pathname === "string" && pathname.startsWith("/admin");
  const showAdminButton = status === "authenticated" && user?.role === "admin" && !isAdminPage;

  return (
    <View className="mb-10 flex-row items-center justify-between">
      <Link href="/" asChild>
        <Pressable>
          <Text className={`font-outfit text-xl font-black tracking-tight ${cx.textInk}`}>
            {config.title}
          </Text>
        </Pressable>
      </Link>

      <View className="flex-row items-center gap-3">
        {status === "authenticated" && user ? (
          <>
            {showAdminButton ? (
              <Link href="/admin" asChild>
                <Pressable className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
                    Admin
                  </Text>
                </Pressable>
              </Link>
            ) : null}
            <Pressable
              onPress={onSignOut}
              className={`rounded-full ${cx.bgInk} px-4 py-2`}
            >
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>
                Sign out
              </Text>
            </Pressable>
          </>
        ) : (
          <Link href="/signin" asChild>
            <Pressable className={`rounded-full ${cx.bgPrimary} px-4 py-2`}>
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>
                Sign in
              </Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
