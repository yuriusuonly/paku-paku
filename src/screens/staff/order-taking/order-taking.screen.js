import { useCallback, useEffect, useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { QrScanner } from "../../../components/qr-scanner.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { StatusPill } from "../../../components/status-pill.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useItemsStore } from "../../../stores/items.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { useStaffOrdersStore } from "../../../stores/staff-orders.store.js";
import { MENU_SORT_RANGES } from "../../../domain/menu/sections.js";
import { orderCreateSchema } from "../../../domain/orders/schema.js";
import { isPaid, isPending, isRefunded, isVoided } from "../../../domain/orders/status.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";
import { ManualOrderForm } from "./manual-order.component.js";

/**
 * Staff order taking screen: manual order entry and counter QR verification.
 * @module screens/staff/order-taking/order-taking.screen
 */

/**
 * @param {object} item - Menu item.
 * @returns {object} Blank order line for the item.
 */
function lineFromItem(item) {
  const category = Number(item.sort_order ?? 0) >= MENU_SORT_RANGES.foodMin ? "food" : "beverage";
  return {
    item_id: item.id,
    item_name: item.name,
    category,
    quantity: "1",
    unit_price_cents: String(item.price_cents ?? 0)
  };
}

/**
 * @returns {object} Empty order-level form state.
 */
function emptyForm() {
  return { status: "Paid", payment_method: "cash", customer_name: "", notes: "" };
}

/**
 * @returns {JSX.Element} Staff order taking screen.
 */
export default function StaffOrderTakingScreen() {
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const items = useItemsStore((s) => s.items);
  const fetchItems = useItemsStore((s) => s.fetchItems);

  const createOrder = useStaffOrdersStore((s) => s.createOrder);
  const loading = useStaffOrdersStore((s) => s.loading);
  const error = useStaffOrdersStore((s) => s.error);
  const order = useStaffOrdersStore((s) => s.order);
  const verify = useStaffOrdersStore((s) => s.verify);
  const setStatus = useStaffOrdersStore((s) => s.setStatus);
  const clear = useStaffOrdersStore((s) => s.clear);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([]);
  const [localError, setLocalError] = useState("");
  const [manualExpanded, setManualExpanded] = useState(true);
  const [verifyExpanded, setVerifyExpanded] = useState(false);
  const [reference, setReference] = useState("");

  useEffect(() => {
    void fetchItems().catch(() => {});
  }, [fetchItems]);

  const onSelectItem = (index, name) => {
    const item = items.find((entry) => entry.name === name);
    if (!item) return;
    setLines((current) => current.map((line, i) => (i === index ? lineFromItem(item) : line)));
  };

  const updateLine = (index, patch) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => {
    const first = items[0];
    setLines((current) => [...current, first ? lineFromItem(first) : { item_name: "", category: null, quantity: "1", unit_price_cents: "0" }]);
  };

  const removeLine = (index) => {
    setLines((current) => current.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setLines([]);
  };

  const onCreate = async () => {
    if (!token) return;
    setLocalError("");
    try {
      const parsed = orderCreateSchema.safeParse({
        status: form.status,
        payment_method: form.payment_method,
        customer_name: form.customer_name,
        notes: form.notes,
        items: lines.map((line) => ({
          item_name: line.item_name,
          category: line.category,
          quantity: line.quantity,
          unit_price_cents: line.unit_price_cents
        }))
      });

      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const field = String(issue?.path?.[issue.path.length - 1] || "");
        const messages = {
          item_name: "a menu item is required.",
          quantity: "quantity must be a positive whole number.",
          unit_price_cents: "unit price is invalid."
        };
        const detail = field === "items" ? "select at least one item." : (messages[field] || "order details are invalid.");
        throw new Error(`Order: ${detail}`);
      }

      const created = await createOrder(token, parsed.data);
      if (created) {
        showSuccess(`Order ${created.order_number} created.`);
        resetForm();
      }
    } catch (e) {
      const message = e?.message || "Could not create the order.";
      setLocalError(message);
      showError(message);
    }
  };

  const runVerify = async (value) => {
    if (!token || !value.trim()) return;
    try {
      const result = await verify(token, value.trim());
      if (result) showSuccess("Order verified.");
    } catch (e) {
      showError(e?.message || "Could not verify that order.");
    }
  };

  const onVerify = () => runVerify(reference);

  const onScan = useCallback((value) => {
    setReference(value);
    void runVerify(value);
  }, [token, verify, showSuccess, showError]);

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
        <Link href="/staff/records" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>View order logs →</Text>
        </Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Order taking</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Enter walk-in orders manually or verify a customer QR code at the counter.
        </Text>
      </View>

      <Alert variant="error" message={localError || error} />

      <AccordionSection
        title="Take an order"
        expanded={manualExpanded}
        onToggle={() => setManualExpanded((value) => !value)}
        className="mb-6"
      >
        <ManualOrderForm
          items={items}
          form={form}
          setForm={setForm}
          lines={lines}
          onSelectItem={onSelectItem}
          updateLine={updateLine}
          addLine={addLine}
          removeLine={removeLine}
          saving={loading}
          onCreate={onCreate}
          onClear={resetForm}
        />
      </AccordionSection>

      <AccordionSection
        title="Verify an order (QR)"
        expanded={verifyExpanded}
        onToggle={() => setVerifyExpanded((value) => !value)}
      >
        <View className="gap-3">
          <TextField
            label="QR payload or order number"
            value={reference}
            onChangeText={setReference}
            placeholder="ORD-XXXXXXXXXX or pasted QR payload"
            autoCapitalize="characters"
          />
          <QrScanner onDetect={onScan} />
          <View className="flex-row flex-wrap gap-3">
            <Button label="Verify order" onPress={onVerify} loading={loading} disabled={!reference.trim()} />
            <Button label="Clear" variant="ghost" onPress={() => { setReference(""); clear(); }} disabled={loading} />
          </View>

          {order ? (
            <View className="mt-2 gap-4">
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
                    <Text className={`font-outfit text-sm ${cx.textInk}`}>{item.item_name} × {item.quantity}</Text>
                    <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>{formatCurrencyCents(item.line_total_cents)}</Text>
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
        </View>
      </AccordionSection>
    </ScreenContainer>
  );
}
