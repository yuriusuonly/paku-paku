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
import { TextField } from "../../components/text-field.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useCartStore } from "../../stores/cart-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { useOrdersStore } from "../../stores/orders-store.js";
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
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const syncing = useOrdersStore((s) => s.syncing);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState({ customer_name: "", customer_phone: "", notes: "", payment_method: "cash" });
  const [error, setError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (hydrated && user?.id) hydrateCart(user.id);
  }, [hydrated, user?.id, hydrateCart]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || user.full_name || "",
        customer_phone: f.customer_phone || user.phone || ""
      }));
    }
  }, [user]);

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
      const data = await placeOrder(token, {
        items: cartItems.map((item) => ({
          menu_item_id: item.menu_item_id || null,
          inventory_item_id: item.inventory_item_id || null,
          item_name: item.item_name,
          quantity: Number(item.quantity || 1),
          unit_price_cents: Number(item.unit_price_cents || 0)
        })),
        customer_name: form.customer_name.trim() || user?.full_name || null,
        customer_phone: form.customer_phone.trim() || user?.phone || null,
        customer_email: user?.email || null,
        notes: form.notes.trim() || null,
        payment_method: form.payment_method.trim() || "cash",
        payment_status: "unpaid",
        status: "pending"
      });
      clearCart();
      if (data?.order) setPlacedOrder(data.order);
      showSuccess("Order placed. Present the QR code at the counter.");
      return data;
    } catch (e) {
      const message = e?.message || "Could not place the order.";
      setError(message);
      showError(message);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Cart & checkout</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Review your cart, place your order, and present the order QR code at the counter.
      </Text>

      <Alert variant="error" message={error} />

      {placedOrder ? (
        <View className="mt-6 gap-4">
          <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Order placed</Text>
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>
              {placedOrder.order_number} · ₱{(Number(placedOrder.total_cents || 0) / 100).toFixed(2)}
            </Text>
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>
              Present this QR code at the counter to complete your buy/sell transaction.
            </Text>
            {placedOrder.qr_payload ? <View className="mt-2"><QrCode value={placedOrder.qr_payload} label="Order QR for counter" /></View> : null}
            <View className="flex-row flex-wrap gap-3 pt-2">
              <Link href="/orders" asChild><Button label="View my orders" /></Link>
              <Button label="Place another order" variant="ghost" onPress={() => { setPlacedOrder(null); router.push("/menu"); }} />
            </View>
          </View>
        </View>
      ) : cartItems.length === 0 ? (
        <View className="mt-6 gap-4">
          <EmptyState message="Your cart is empty. Add items from the menu to place an order." />
          <Link href="/menu" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text></Pressable></Link>
        </View>
      ) : (
        <View className="mt-6 gap-6">
          <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Items</Text>
            {cartItems.map((item) => {
              const key = keyOf(item);
              return (
                <View key={key} className={`rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4`}>
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>{item.item_name}</Text>
                      <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                        ₱{(Number(item.unit_price_cents || 0) / 100).toFixed(2)} × {item.quantity} = ₱{((Number(item.unit_price_cents || 0) * Number(item.quantity || 0)) / 100).toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Button label="-" variant="ghost" onPress={() => setQuantity(key, Number(item.quantity || 0) - 1)} />
                      <Button label="+" variant="ghost" onPress={() => setQuantity(key, Number(item.quantity || 0) + 1)} />
                      <Button label="Remove" variant="ghost" onPress={() => removeItem(key)} />
                    </View>
                  </View>
                </View>
              );
            })}
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Total: ₱{(totalCents / 100).toFixed(2)}</Text>
          </View>

          <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Checkout details</Text>
            <TextField label="Full name" value={form.customer_name} onChangeText={(v) => setForm((f) => ({ ...f, customer_name: v }))} placeholder="Your name" />
            <TextField label="Phone" value={form.customer_phone} onChangeText={(v) => setForm((f) => ({ ...f, customer_phone: v }))} placeholder="Contact number" />
            <TextField label="Payment method" value={form.payment_method} onChangeText={(v) => setForm((f) => ({ ...f, payment_method: v }))} placeholder="cash, card, gcash..." />
            <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Order notes (optional)" multiline numberOfLines={3} />
            <View className="flex-row flex-wrap gap-3 pt-2">
              <Button label="Place order" onPress={checkout} loading={syncing} />
              <Button label="Clear cart" variant="ghost" onPress={clearCart} disabled={syncing} />
            </View>
            <Text className={`font-outfit text-xs ${cx.textInk60}`}>
              Placing an order generates an order QR code for you to present at the counter.
            </Text>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
