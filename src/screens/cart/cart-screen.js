import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { Alert } from "../../components/alert.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useCartStore } from "../../stores/cart-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { useTransactionsStore } from "../../stores/transactions-store.js";
import { cx } from "../../shared/constants/theme.js";
import { CartItemsSection } from "./cart-items-component.js";
import { CartPlacedSection } from "./cart-placed-component.js";

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
          item_name: item.item_name,
          quantity: Number(item.quantity || 1),
          unit_price_cents: Number(item.unit_price_cents || 0)
        })),
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
        <CartPlacedSection
          transaction={placedTransaction}
          onNewTransaction={() => { setPlacedTransaction(null); router.push("/menu"); }}
        />
      ) : (
        <CartItemsSection
          cartItems={cartItems}
          totalCents={totalCents}
          syncing={syncing}
          onSetQuantity={setQuantity}
          onRemoveItem={removeItem}
          onCheckout={checkout}
          onClearCart={clearCart}
        />
      )}
    </ScreenContainer>
  );
}
