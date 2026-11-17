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
 * @param {{transaction: object, onNewTransaction: () => void}} props
 * @returns {JSX.Element}
 */
export function CartPlacedSection({ transaction, onNewTransaction }) {
  return (
    <View className="mt-6 gap-4">
      <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
        <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Order placed</Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          {transaction.order_number} · {formatCurrencyCents(transaction.total_cents)}
        </Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          Payment: {String(transaction.payment_method || "cash").toUpperCase()}
        </Text>

        {Array.isArray(transaction.items) && transaction.items.length ? (
          <View className="mt-2 gap-1">
            {transaction.items.map((item, index) => (
              <Text key={`${item.item_name}-${index}`} className={`font-outfit text-xs ${cx.textInk70}`}>
                • {item.item_name} × {item.quantity}
              </Text>
            ))}
          </View>
        ) : null}

        {transaction.qr_payload ? (
          <View className="mt-2">
            <QrCode value={transaction.qr_payload} label="Order QR for counter" />
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-3 pt-2">
          <Button label="New order" variant="ghost" onPress={onNewTransaction} />
        </View>
      </View>
    </View>
  );
}
