import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import { CircularProgress } from "../../components/circular-progress.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { useCheckoutStore } from "../../stores/checkout.store.js";
import { cx } from "../../constants/theme.js";
import { CheckoutOrderSection } from "./checkout-order.component.js";

/**
 * Customer order confirmation screen shown after checkout.
 * @module screens/checkout/checkout.screen
 */

/**
 * @returns {JSX.Element} Checkout confirmation screen.
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const order = useCheckoutStore((s) => s.order);
  const hydrated = useCheckoutStore((s) => s.hydrated);
  const hydrate = useCheckoutStore((s) => s.hydrate);
  const clear = useCheckoutStore((s) => s.clear);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const onNewOrder = () => {
    clear();
    router.replace("/menu");
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`${cx.typography.heading} ${cx.textInk}`}>Checkout</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Show the QR code at the counter to complete your order.
      </Text>

      {!hydrated ? (
        <CircularProgress message="Loading your order..." />
      ) : order ? (
        <CheckoutOrderSection order={order} onNewOrder={onNewOrder} />
      ) : (
        <Text className={`font-outfit mt-6 text-base ${cx.textInk70}`}>
          No recent order found.{" "}
          <Link href="/menu" asChild>
            <Text className={`font-semibold ${cx.textPrimary}`}>Browse the menu</Text>
          </Link>{" "}
          to place one.
        </Text>
      )}
    </ScreenContainer>
  );
}
