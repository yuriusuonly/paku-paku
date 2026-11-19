import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth.store.js";
import { useCartStore } from "../stores/cart.store.js";
import config from "../shared/constants/config.js";
import { cx } from "../shared/constants/theme.js";
import { isAdminRole, isStaffRole } from "../domain/auth/roles.js";

/**
 * Site header with storefront navigation and role-specific staff actions.
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
  const isAdmin = status === "authenticated" && isAdminRole(user?.role);
  const isStaff = status === "authenticated" && isStaffRole(user?.role);

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
            <Pressable
              onPress={onSignOut}
              accessibilityRole="button"
              className={`min-h-[44px] rounded-full ${cx.bgPrimary} px-4 py-2`}
            >
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign out</Text>
            </Pressable>
          </>
        ) : isStaff ? (
          <>
            <Link href="/staff/order-taking" asChild>
              <Pressable accessibilityRole="link" className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Order taking</Text>
              </Pressable>
            </Link>
            <Link href="/staff/logs" asChild>
              <Pressable accessibilityRole="link" className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Order logs</Text>
              </Pressable>
            </Link>
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
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign in</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
