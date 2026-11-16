import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { QrCode } from "../../components/qr-code.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Placed transaction confirmation section.
 * @module screens/cart/cart-placed-component
 */

export function CartPlacedSection({ transaction, onNewTransaction }) {
  return (
    <View className="mt-6 gap-4">
      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Transaction placed</Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          {transaction.order_number} · {formatCurrencyCents(transaction.total_cents)}
        </Text>
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>
          Present this QR code at the counter to complete your transaction.
        </Text>
        {transaction.qr_payload ? <View className="mt-2"><QrCode value={transaction.qr_payload} label="Transaction QR for counter" /></View> : null}
        <View className="flex-row flex-wrap gap-3 pt-2">
          <Link href="/transactions" asChild><Button label="View my transactions" /></Link>
          <Button label="New transaction" variant="ghost" onPress={onNewTransaction} />
        </View>
      </View>
    </View>
  );
}
