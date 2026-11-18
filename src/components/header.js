import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth.store.js";
import { useCartStore } from "../stores/cart.store.js";
import config from "../shared/constants/config.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Site header with storefront navigation and staff sign-in actions.
 * @module components/header
 */

/**
 * @returns {JSX.Element} Header element.
 */
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0));

  const onSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const isAdminPage = typeof pathname === "string" && pathname.startsWith("/admin");
  const isStaffPage = typeof pathname === "string" && pathname.startsWith("/staff");
  const isAdmin = status === "authenticated" && user?.role === "admin";

  return (
    <View className={`mb-6 flex-row flex-wrap items-center justify-between ${cx.spacing.md} sm:mb-8 md:mb-10`}>
      <View className={`flex-row flex-wrap items-center ${cx.spacing.md}`}>
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`${config.title} home`}>
            <Text className={`${cx.typography.title} ${cx.textInk}`}>{config.title}</Text>
          </Pressable>
        </Link>
        <Link href="/menu" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Menu">
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Menu</Text>
          </Pressable>
        </Link>
        <Link href="/cart" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={`Cart, ${cartCount} items`}>
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>
              Cart{cartCount ? ` (${cartCount})` : ""}
            </Text>
          </Pressable>
        </Link>
      </View>

      <View className={`flex-row flex-wrap items-center ${cx.spacing.md}`}>
        {isAdmin ? (
          <>
            {!isAdminPage ? (
              <Link href="/admin" asChild>
                <Pressable accessibilityRole="link" className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Admin</Text>
                </Pressable>
              </Link>
            ) : null}
            {!isStaffPage ? (
              <Link href="/staff" asChild>
                <Pressable accessibilityRole="link" className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Counter</Text>
                </Pressable>
              </Link>
            ) : null}
            <Pressable
              onPress={onSignOut}
              accessibilityRole="button"
              className={`min-h-[44px] rounded-full ${cx.bgPrimary} px-4 py-2`}
            >
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <Link href="/signin" asChild>
            <Pressable accessibilityRole="link" className={`min-h-[44px] rounded-full ${cx.bgPrimary} px-4 py-2`}>
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Staff sign in</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
