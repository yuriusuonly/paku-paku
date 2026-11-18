import { useState } from "react";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { StatusPill } from "../../../components/status-pill.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useStaffOrdersStore } from "../../../stores/staff-orders.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { isPaid, isPending, isRefunded, isVoided } from "../../../domain/orders/status.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Staff counter order verification screen.
 * @module screens/staff/orders/verify.screen
 */

/**
 * @returns {JSX.Element} Staff verification screen.
 */
export default function StaffVerifyScreen() {
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const order = useStaffOrdersStore((s) => s.order);
  const loading = useStaffOrdersStore((s) => s.loading);
  const error = useStaffOrdersStore((s) => s.error);
  const verify = useStaffOrdersStore((s) => s.verify);
  const setStatus = useStaffOrdersStore((s) => s.setStatus);
  const clear = useStaffOrdersStore((s) => s.clear);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [reference, setReference] = useState("");

  const onVerify = async () => {
    if (!token || !reference.trim()) return;
    try {
      const result = await verify(token, reference.trim());
      if (result) showSuccess("Order verified.");
    } catch (e) {
      showError(e?.message || "Could not verify that order.");
    }
  };

  const onStatus = async (status) => {
    if (!token || !order?.id) return;
    try {
      await setStatus(token, order.id, status);
      showSuccess(`Order marked ${status.toLowerCase()}.`);
    } catch (e) {
      showError(e?.message || "Could not update the order.");
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Counter verification</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Scan or enter the customer QR payload to verify and complete an order.
        </Text>
      </View>

      <Alert variant="error" message={error} />

      <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
        <TextField
          label="QR payload or order number"
          value={reference}
          onChangeText={setReference}
          placeholder="ORD-XXXXXXXXXX or pasted QR payload"
          autoCapitalize="characters"
          error={Boolean(error)}
        />
        <View className="flex-row flex-wrap gap-3">
          <Button label="Verify order" onPress={onVerify} loading={loading} disabled={!reference.trim()} />
          <Button label="Clear" variant="ghost" onPress={() => { setReference(""); clear(); }} disabled={loading} />
        </View>
      </View>

      {order ? (
        <View className="mt-6 gap-4">
          <SectionHeader
            title="Verified order"
            right={<StatusPill label={order.status} variant={isPaid(order.status) ? "success" : isPending(order.status) ? "info" : isRefunded(order.status) ? "warning" : "danger"} />}
          />

          <StatGrid
            stats={[
              { label: "Reference", value: order.order_number },
              { label: "Payment", value: String(order.payment_method || "cash").toUpperCase() },
              { label: "Total", value: formatCurrencyCents(order.total_cents) },
              { label: "Placed", value: formatAuditTimestamp(order.placed_at || order.created_at) }
            ]}
          />

          <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.sm}`}>
            <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Items</Text>
            {Array.isArray(order.items) && order.items.length ? order.items.map((item, index) => (
              <View key={item.id || index} className="flex-row items-center justify-between gap-3">
                <Text className={`font-outfit text-sm ${cx.textInk}`}>
                  {item.item_name} × {item.quantity}
                </Text>
                <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
                  {formatCurrencyCents(item.line_total_cents)}
                </Text>
              </View>
            )) : (
              <Text className={`font-outfit text-sm ${cx.textInk70}`}>No line items recorded.</Text>
            )}
          </View>

          <View className="flex-row flex-wrap gap-3">
            <Button label="Mark Paid" onPress={() => onStatus("Paid")} loading={loading} disabled={isPaid(order.status)} />
            <Button label="Refund" variant="secondary" onPress={() => onStatus("Refunded")} loading={loading} disabled={isRefunded(order.status)} />
            <Button label="Void" variant="ghost" onPress={() => onStatus("Voided")} loading={loading} disabled={isVoided(order.status)} />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
