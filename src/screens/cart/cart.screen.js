import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { Alert } from "../../components/alert.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { useCartStore } from "../../stores/cart.store.js";
import { useNotificationStore } from "../../stores/notification.store.js";
import { placeOrder } from "../../services/checkout.js";
import { PAYMENT_METHODS } from "../../domain/orders/constants.js";
import { calculateOrderTotals } from "../../domain/orders/pricing.js";
import { cx } from "../../shared/constants/theme.js";
import { CartItemsSection } from "./cart-items.component.js";
import { CartPlacedSection } from "./cart-placed.component.js";

/**
 * Public kiosk cart and checkout screen.
 * @module screens/cart/cart.screen
 */

/**
 * @returns {JSX.Element} Cart screen.
 */
export default function CartScreen() {
  const cartItems = useCartStore((s) => s.items);
  const hydrateCart = useCartStore((s) => s.hydrate);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

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
      });
      clearCart();
      if (data?.order) setPlacedOrder(data.order);
      showSuccess("Order placed. Present the QR code at the counter.");
      return data;
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
      <Text className={`${cx.typography.heading} ${cx.textInk}`}>Cart & checkout</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Choose how you want to pay, place your order, and present the QR code at the counter.
      </Text>

      <Alert variant="error" message={error} />

      {placedOrder ? (
        <CartPlacedSection
          order={placedOrder}
          onNewOrder={() => setPlacedOrder(null)}
        />
      ) : (
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
      )}
    </ScreenContainer>
  );
}
