import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Alert } from "../../../components/alert.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useItemsStore } from "../../../stores/items.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { useStaffOrdersStore } from "../../../stores/staff-orders.store.js";
import { PAYMENT_METHODS } from "../../../domain/orders/constants.js";
import { MENU_SORT_RANGES } from "../../../domain/menu/sections.js";
import { orderCreateSchema } from "../../../domain/orders/schema.js";
import { cx } from "../../../shared/constants/theme.js";
import { ManualOrderForm } from "./manual-order.component.js";

/**
 * Staff order taking screen: one form for manual entry and QR-based lookup.
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
  const verify = useStaffOrdersStore((s) => s.verify);
  const setStatus = useStaffOrdersStore((s) => s.setStatus);
  const clear = useStaffOrdersStore((s) => s.clear);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState([]);
  const [reference, setReference] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [localError, setLocalError] = useState("");
  const [expanded, setExpanded] = useState(true);
  const lookedUpRef = useRef("");

  useEffect(() => {
    void fetchItems().catch(() => {});
  }, [fetchItems]);

  /**
   * Looks up an order and fills the form from its snapshots.
   *
   * @param {string} value - QR payload or order number.
   * @returns {Promise<void>}
   */
  const fillFromReference = useCallback(async (value) => {
    const trimmed = String(value || "").trim();
    if (!token || !trimmed) return;
    setLocalError("");
    lookedUpRef.current = trimmed;

    try {
      const found = await verify(token, trimmed);
      if (!found) return;
      const resolved = found.order_number || trimmed;
      lookedUpRef.current = resolved;
      setMatchedOrder(found);
      setReference(resolved);
      setLines((found.items || []).map((item) => ({
        item_id: item.item_id || null,
        item_name: item.item_name,
        category: item.category || null,
        quantity: String(item.quantity ?? 1),
        unit_price_cents: String(item.unit_price_cents ?? 0)
      })));
      setForm({
        status: "Paid",
        payment_method: PAYMENT_METHODS.includes(found.payment_method) ? found.payment_method : "cash",
        customer_name: found.customer_name || "",
        notes: found.notes || ""
      });
      showSuccess(`Order ${found.order_number} loaded.`);
    } catch (e) {
      setMatchedOrder(null);
      const message = e?.message || "Could not find that order.";
      setLocalError(message);
      showError(message);
    }
  }, [token, verify, showSuccess, showError]);

  useEffect(() => {
    const value = reference.trim();
    if (!value || lookedUpRef.current === value) return;
    if (!/^(ORD:|ORD-[A-Z0-9]{10}$)/i.test(value)) return;
    void fillFromReference(value);
  }, [reference, fillFromReference]);

  const onScan = useCallback((value) => {
    setReference(value);
    void fillFromReference(value);
  }, [fillFromReference]);

  const resetForm = () => {
    lookedUpRef.current = "";
    setForm(emptyForm());
    setLines([]);
    setReference("");
    setMatchedOrder(null);
    setLocalError("");
    clear();
  };

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

  const onSave = async () => {
    if (!token) return;
    setLocalError("");

    try {
      if (matchedOrder) {
        await setStatus(token, matchedOrder.id, form.status);
        showSuccess(`Order ${matchedOrder.order_number} verified.`);
      } else {
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
        if (!created) return;
        showSuccess(`Order ${created.order_number} created.`);
      }

      resetForm();
    } catch (e) {
      const message = e?.message || (matchedOrder ? "Could not verify that order." : "Could not create the order.");
      setLocalError(message);
      showError(message);
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
          Enter walk-in orders manually, or scan/enter an order reference to fill the form automatically.
        </Text>
      </View>

      <Alert variant="error" message={localError || error} />

      <AccordionSection
        title="Take an order"
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        className="mb-6"
      >
        <ManualOrderForm
          items={items}
          reference={reference}
          onReferenceChange={setReference}
          onLookup={() => void fillFromReference(reference)}
          onScan={onScan}
          matchedOrder={matchedOrder}
          form={form}
          setForm={setForm}
          lines={lines}
          onSelectItem={onSelectItem}
          updateLine={updateLine}
          addLine={addLine}
          removeLine={removeLine}
          saving={loading}
          onSave={onSave}
          onClear={resetForm}
          saveLabel={matchedOrder ? "Verify order" : "Create order"}
        />
      </AccordionSection>
    </ScreenContainer>
  );
}
