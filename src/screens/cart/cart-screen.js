import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { EmptyState } from "../../components/empty-state.js";
import { Header } from "../../components/header.js";
import { QrCode } from "../../components/qr-code.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useCartStore } from "../../stores/cart-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { useTransactionsStore } from "../../stores/transactions-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer cart and checkout screen.
 * @module screens/cart/cart-screen
 */

export default function CartScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isCustomer = status === "authenticated" && user && user.role !== "admin";

  const cartItems = useCartStore((s) => s.items);
  const hydrateCart = useCartStore((s) => s.hydrate);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const createMyTransaction = useTransactionsStore((s) => s.createMyTransaction);
  const syncing = useTransactionsStore((s) => s.syncing);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [error, setError] = useState("");
  const [placedTransaction, setPlacedTransaction] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (hydrated && user?.id) hydrateCart(user.id);
  }, [hydrated, user?.id, hydrateCart]);

  const totalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.unit_price_cents || 0) * Number(item.quantity || 0), 0),
    [cartItems]
  );

  if (!hydrated || !isCustomer) {
    return <ScreenContainer><CircularProgress message="Loading cart..." /></ScreenContainer>;
  }

  const keyOf = (item) => `${item.menu_item_id || item.inventory_item_id || item.item_name}`;

  const checkout = async () => {
    if (!token) return;
    setError("");
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    try {
      const data = await createMyTransaction(token, {
        items: cartItems.map((item) => ({
          menu_item_id: item.menu_item_id || null,
          inventory_item_id: item.inventory_item_id || null,
          item_name: item.item_name,
          quantity: Number(item.quantity || 1),
          unit_price_cents: Number(item.unit_price_cents || 0)
        })),
        customer_name: user?.full_name || null,
        customer_phone: user?.phone || null,
        customer_email: user?.email || null,
        payment_status: "unpaid",
        status: "pending"
      });
      clearCart();
      if (data?.transaction) setPlacedTransaction(data.transaction);
      showSuccess("Transaction placed. Present the QR code at the counter.");
      return data;
    } catch (e) {
      const message = e?.message || "Could not place the transaction.";
      setError(message);
      showError(message);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Cart & checkout</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Add items, place a buy transaction, and present the QR code at the counter.
      </Text>

      <Alert variant="error" message={error} />

      {placedTransaction ? (
        <View className="mt-6 gap-4">
          <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Transaction placed</Text>
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>
              {placedTransaction.order_number} · ₱{(Number(placedTransaction.total_cents || 0) / 100).toFixed(2)}
            </Text>
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>
              Present this QR code at the counter to complete your transaction.
            </Text>
            {placedTransaction.qr_payload ? <View className="mt-2"><QrCode value={placedTransaction.qr_payload} label="Transaction QR for counter" /></View> : null}
            <View className="flex-row flex-wrap gap-3 pt-2">
              <Link href="/transactions" asChild><Button label="View my transactions" /></Link>
              <Button label="New transaction" variant="ghost" onPress={() => { setPlacedTransaction(null); router.push("/menu"); }} />
            </View>
          </View>
        </View>
      ) : cartItems.length === 0 ? (
        <View className="mt-6 gap-4">
          <EmptyState message="Your cart is empty. Add items from the menu to place a transaction." />
          <Link href="/menu" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text></Pressable></Link>
        </View>
      ) : (
        <View className="mt-6 gap-8">
          <View>
            <Text className={`font-outfit mb-3 text-xl font-black tracking-tight ${cx.textInk}`}>Items</Text>
            <View className="gap-3">
              {cartItems.map((item) => {
                const key = keyOf(item);
                return (
                  <View key={key} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 md:p-6`}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>{item.item_name}</Text>
                        <Text className={`font-outfit mt-2 text-sm md:text-base ${cx.textInk70}`}>
                          ₱{(Number(item.unit_price_cents || 0) / 100).toFixed(2)} × {item.quantity} = ₱{((Number(item.unit_price_cents || 0) * Number(item.quantity || 0)) / 100).toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap justify-end gap-2">
                        <Button label="-" variant="ghost" onPress={() => setQuantity(key, Number(item.quantity || 0) - 1)} />
                        <Button label="+" variant="ghost" onPress={() => setQuantity(key, Number(item.quantity || 0) + 1)} />
                        <Button label="Remove" variant="ghost" onPress={() => removeItem(key)} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 md:p-6 gap-2`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Total: ₱{(totalCents / 100).toFixed(2)}</Text>
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>
              Uses account details: {user?.full_name || "Name not set"} · {user?.phone || "Phone not set"} · {user?.email || "-"}
            </Text>
            <Link href="/account" asChild>
              <Pressable>
                <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Update account details →</Text>
              </Pressable>
            </Link>
            <View className="flex-row flex-wrap gap-3 pt-1">
              <Button label="Place transaction" onPress={checkout} loading={syncing} />
              <Button label="Clear cart" variant="ghost" onPress={clearCart} disabled={syncing} />
            </View>
            <Text className={`font-outfit text-xs ${cx.textInk60}`}>
              Placing a transaction generates a QR code for you to present at the counter.
            </Text>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
