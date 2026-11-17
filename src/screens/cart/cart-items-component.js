import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { EmptyState } from "../../components/empty-state.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Cart items and checkout summary section.
 * @module screens/cart/cart-items-component
 */

export function CartItemsSection({ cartItems, totalCents, syncing, onSetQuantity, onRemoveItem, onCheckout, onClearCart }) {
  const keyOf = (item) => `${item.menu_item_id || item.item_name}`;

  if (cartItems.length === 0) {
    return (
      <View className="mt-6 gap-4">
        <EmptyState message="Your cart is empty. Add items from the menu to place a transaction." />
        <Link href="/menu" asChild><Pressable><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text></Pressable></Link>
      </View>
    );
  }

  return (
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

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 md:p-6 gap-2`}>
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Total: {formatCurrencyCents(totalCents)}</Text>
        <View className="flex-row flex-wrap gap-3 pt-1">
          <Button label="Place transaction" onPress={onCheckout} loading={syncing} />
          <Button label="Clear cart" variant="ghost" onPress={onClearCart} disabled={syncing} />
        </View>
        <Text className={`font-outfit text-xs ${cx.textInk60}`}>
          Placing a transaction generates a QR code for you to present at the counter.
        </Text>
      </View>
    </View>
  );
}
