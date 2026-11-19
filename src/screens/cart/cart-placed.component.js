import { Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { QrCode } from "../../components/qr-code.js";
import { StatusPill } from "../../components/status-pill.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Placed order confirmation with counter QR code.
 * @module screens/cart/cart-placed.component
 */

/**
 * @param {{order: object, onNewOrder: () => void}} props
 * @returns {JSX.Element}
 */
export function CartPlacedSection({ order, onNewOrder }) {
  const paymentMethod = String(order.payment_method || "cash").toUpperCase();

  return (
    <View className="mt-6 gap-4">
      <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Order placed</Text>
          <StatusPill label={paymentMethod} variant="info" />
        </View>

        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          Reference: <Text className={`font-semibold ${cx.textInk}`}>{order.order_number}</Text>
        </Text>
        {Number(order.discount_cents || 0) > 0 ? (
          <Text className={`font-outfit text-sm ${cx.textPrimary}`}>
            Meal discount: -{formatCurrencyCents(order.discount_cents)}
          </Text>
        ) : null}
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          Total: <Text className={`font-semibold ${cx.textInk}`}>{formatCurrencyCents(order.total_cents)}</Text>
        </Text>

        {Array.isArray(order.items) && order.items.length ? (
          <View className="mt-2 gap-1">
            {order.items.map((item, index) => (
              <Text key={`${item.item_name}-${index}`} className={`font-outfit text-xs ${cx.textInk70}`}>
                • {item.item_name} × {item.quantity}
              </Text>
            ))}
          </View>
        ) : null}

        {order.qr_payload ? (
          <View className={`mt-4 items-center ${cx.radius.md} ${cx.bgSurfaceSoft} p-4`}>
            <QrCode
              value={order.qr_payload}
              label="Show at the counter"
              caption={order.order_number}
              size={180}
            />
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3 pt-2">
          <Button label="New order" variant="ghost" onPress={onNewOrder} />
        </View>
      </View>
    </View>
  );
}
