import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { EmptyState } from "../../components/empty-state.js";
import { formatCurrencyCents } from "../../format/currency.js";
import { PAYMENT_METHODS } from "../../domain/orders/constants.js";
import { cx } from "../../constants/theme.js";

/**
 * Cart items, payment method selection, and checkout summary.
 * @module screens/cart/cart-items.component
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function CartItemsSection({
  cartItems,
  subtotalCents,
  discountCents,
  totalCents,
  syncing,
  paymentMethod,
  onPaymentMethodChange,
  onSetQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart
}) {
  const keyOf = (item) => `${item.item_id || item.item_name}`;

  if (cartItems.length === 0) {
    return (
      <View className="mt-6 gap-4">
        <EmptyState message="Your cart is empty. Add items from the menu to place an order." />
        <Link href="/menu" asChild>
          <Pressable accessibilityRole="link">
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="mt-6 gap-8">
      <View>
        <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Items</Text>
        <View className={cx.spacing.md}>
          {cartItems.map((item) => {
            const key = keyOf(item);
            return (
              <View key={key} className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad}`}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>{item.item_name}</Text>
                    <Text className={`font-outfit mt-2 text-sm md:text-base ${cx.textInk70}`}>
                      {formatCurrencyCents(item.unit_price_cents)} × {item.quantity} = {formatCurrencyCents(Number(item.unit_price_cents || 0) * Number(item.quantity || 0))}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap justify-end gap-2">
                    <Button label="-" variant="ghost" onPress={() => onSetQuantity(key, Number(item.quantity || 0) - 1)} />
                    <Button label="+" variant="ghost" onPress={() => onSetQuantity(key, Number(item.quantity || 0) + 1)} />
                    <Button label="Remove" variant="ghost" onPress={() => onRemoveItem(key)} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.sm}`}>
        <Text className={`${cx.typography.label} ${cx.textInk60}`}>Payment method</Text>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <Pressable
              key={method}
              onPress={() => onPaymentMethodChange(method)}
              disabled={syncing}
              accessibilityRole="button"
              accessibilityState={{ selected: method === paymentMethod }}
              className={`min-h-[44px] rounded-full border px-4 py-2 ${
                method === paymentMethod
                  ? `${cx.bgPrimary} ${cx.borderPrimary}`
                  : `${cx.bgSurfaceSoft} ${cx.borderSubtle}`
              }`}
            >
              <Text className={`font-outfit text-sm font-semibold ${method === paymentMethod ? cx.textWhite : cx.textInk}`}>
                {method.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-4 gap-1">
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>
            Subtotal: {formatCurrencyCents(subtotalCents)}
          </Text>
          {discountCents > 0 ? (
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>
              Discount: -{formatCurrencyCents(discountCents)}
            </Text>
          ) : null}
          <Text className={`${cx.typography.title} ${cx.textInk}`}>
            Total: {formatCurrencyCents(totalCents)}
          </Text>
        </View>
        {discountCents > 0 ? (
          <Text className={`font-outfit text-xs ${cx.textInk60}`}>
            Meal discount applied because your order has a main dish and a drink.
          </Text>
        ) : null}
        <View className="flex-row flex-wrap gap-3 pt-1">
          <Button label="Place order" onPress={onCheckout} loading={syncing} />
          <Button label="Clear cart" variant="ghost" onPress={onClearCart} disabled={syncing} />
        </View>
        <Text className={`font-outfit text-xs ${cx.textInk60}`}>
          Your QR code will include the items and selected payment method.
        </Text>
      </View>
    </View>
  );
}
