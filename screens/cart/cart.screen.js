import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";
import { Alert } from "../../components/alert.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useCartStore } from "../../stores/cart.store.js";
import { useCheckoutStore } from "../../stores/checkout.store.js";
import { useNotificationStore } from "../../stores/notification.store.js";
import { placeOrder } from "../../services/checkout.js";
import { PAYMENT_METHODS } from "../../domain/orders/constants.js";
import { calculateOrderTotals } from "../../domain/orders/pricing.js";
import { cx } from "../../shared/constants/theme.js";
import { CartItemsSection } from "./cart-items.component.js";

/**
 * Customer cart screen; successful placement continues to `/checkout`.
 * @module screens/cart/cart.screen
 */

/**
 * @returns {JSX.Element} Cart screen.
 */
export default function CartScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.session?.access_token);

  const cartItems = useCartStore((s) => s.items);
  const hydrateCart = useCartStore((s) => s.hydrate);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const setOrder = useCheckoutStore((s) => s.setOrder);
  const showError = useNotificationStore((s) => s.showError);

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    hydrateCart();
  }, [hydrateCart]);

  const totals = useMemo(() => calculateOrderTotals(cartItems), [cartItems]);

  const checkout = async () => {
    setError("");
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setPlacing(true);
    try {
      const data = await placeOrder({
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          item_name: item.item_name,
          category: item.category || null,
          quantity: Number(item.quantity || 1),
          unit_price_cents: Number(item.unit_price_cents || 0)
        }))
      }, token);
      setOrder(data?.order || null);
      clearCart();
      router.replace("/checkout");
    } catch (e) {
      const message = e?.message || "Could not place the order.";
      setError(message);
      showError(message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`${cx.typography.heading} ${cx.textInk}`}>Cart</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Choose how you want to pay and place your order. You will get a QR code to show at the counter.
      </Text>

      <Alert variant="error" message={error} />

      <CartItemsSection
        cartItems={cartItems}
        subtotalCents={totals.subtotalCents}
        discountCents={totals.discountCents}
        totalCents={totals.totalCents}
        syncing={placing}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        onSetQuantity={setQuantity}
        onRemoveItem={removeItem}
        onCheckout={checkout}
        onClearCart={clearCart}
      />
    </ScreenContainer>
  );
}
