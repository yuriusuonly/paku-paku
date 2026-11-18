import { Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { QrCode } from "../../components/qr-code.js";
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
  return (
    <View className="mt-6 gap-4">
      <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
        <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Order placed</Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          {order.order_number} · {formatCurrencyCents(order.total_cents)}
        </Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          Payment: {String(order.payment_method || "cash").toUpperCase()}
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
          <View className="mt-2">
            <QrCode value={order.qr_payload} label="Order QR for counter" />
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3 pt-2">
          <Button label="New order" variant="ghost" onPress={onNewOrder} />
        </View>
      </View>
    </View>
  );
}
