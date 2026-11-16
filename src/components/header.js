import { Link, usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAuthStore } from "../stores/auth-store.js";
import { useCartStore } from "../stores/cart-store.js";
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
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0));

  const onSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const isAdminPage = typeof pathname === "string" && pathname.startsWith("/admin");
  const isAuthenticated = status === "authenticated" && user;
  const isCustomer = isAuthenticated && user?.role !== "admin";
  const showAdminButton = isAuthenticated && user?.role === "admin" && !isAdminPage;

  return (
    <View className="mb-10 flex-row flex-wrap items-center justify-between gap-3">
      <View className="flex-row flex-wrap items-center gap-3">
        <Link href={isAuthenticated ? "/menu" : "/"} asChild>
          <Pressable>
            <Text className={`font-outfit text-xl font-black tracking-tight ${cx.textInk}`}>
              {config.title}
            </Text>
          </Pressable>
        </Link>
        {isCustomer ? (
          <>
            <Link href="/menu" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Menu</Text></Pressable></Link>
            <Link href="/cart" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Cart{cartCount ? ` (${cartCount})` : ""}</Text></Pressable></Link>
            <Link href="/transactions" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Transactions</Text></Pressable></Link>
            <Link href="/account" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Account</Text></Pressable></Link>
          </>
        ) : null}
      </View>

      <View className="flex-row items-center gap-3">
        {isAuthenticated ? (
          <>
            {showAdminButton ? (
              <Link href="/admin" asChild>
                <Pressable className={`rounded-full ${cx.bgSurfaceMuted} px-4 py-2`}>
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Admin</Text>
                </Pressable>
              </Link>
            ) : null}
            <Pressable onPress={onSignOut} className={`rounded-full ${cx.bgPrimary} px-4 py-2`}>
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <Link href="/signin" asChild>
            <Pressable className={`rounded-full ${cx.bgPrimary} px-4 py-2`}>
              <Text className={`font-outfit text-sm font-semibold ${cx.textWhite}`}>Sign in</Text>
            </Pressable>
          </Link>
        )}
      </View>
    </View>
  );
}
