import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth.store.js";
import { useCartStore } from "../stores/cart.store.js";
import config from "../shared/constants/config.js";
import { cx } from "../shared/constants/theme.js";
import { isAdminRole, isCustomerRole, isStaffRole } from "../domain/auth/roles.js";

/**
 * Site header with role-specific navigation and sign-in actions.
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
  const isCustomer = status === "authenticated" && isCustomerRole(user?.role);

  /**
   * @param {string} href - Route to link to.
   * @param {string} label - Link label.
   * @returns {JSX.Element} Navigation pill.
   */
  const navLink = (href, label) => (
    <Link key={href} href={href} asChild>
      <Pressable accessibilityRole="link" className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
        <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>{label}</Text>
      </Pressable>
    </Link>
  );

  const signOutButton = (
    <Pressable
      onPress={onSignOut}
      accessibilityRole="button"
      className={`min-h-[44px] rounded-full ${cx.bgPrimary} px-4 py-2`}
    >
      <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign out</Text>
    </Pressable>
  );

  return (
    <View className={`mb-6 flex-row flex-wrap items-center justify-between ${cx.spacing.md} sm:mb-8 md:mb-10`}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`${config.title} home`}>
          <Text className={`${cx.typography.title} ${cx.textInk}`}>{config.title}</Text>
        </Pressable>
      </Link>

      <View className={`flex-row flex-wrap items-center ${cx.spacing.md}`}>
        {isAdmin ? (
          <>
            {!isAdminPage ? navLink("/admin", "Admin") : null}
            {signOutButton}
          </>
        ) : isStaff ? (
          <>
            {navLink("/staff/order-taking", "Order taking")}
            {navLink("/staff/logs", "Order logs")}
            {signOutButton}
          </>
        ) : isCustomer ? (
          <>
            {navLink("/menu", "Menu")}
            {navLink("/cart", `Cart${cartCount ? ` (${cartCount})` : ""}`)}
            {signOutButton}
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
