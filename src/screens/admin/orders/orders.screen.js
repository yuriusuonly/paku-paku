import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { useOrdersStore } from "../../../stores/orders.store.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";
import { orderCreateSchema } from "../../../domain/orders/schema.js";
import { OrdersFormSection } from "./orders-form.component.js";
import { OrdersTableSection } from "./orders-table.component.js";

/**
 * Admin unified orders management screen.
 * @module screens/admin/orders/orders.screen
 */

function emptyLine() {
  return { item_name: "", quantity: "1", unit_price_cents: "0" };
}

export default function AdminOrdersScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isAdmin = status === "authenticated" && user?.role === "admin";

  const orders = useOrdersStore((s) => s.adminOrders);
  const loading = useOrdersStore((s) => s.loading);
  const syncing = useOrdersStore((s) => s.syncing);
  const error = useOrdersStore((s) => s.error);
  const fetchAdminOrders = useOrdersStore((s) => s.fetchAdminOrders);
  const subscribeAdmin = useOrdersStore((s) => s.subscribeAdmin);
  const unsubscribe = useOrdersStore((s) => s.unsubscribe);
  const createAdminOrder = useOrdersStore((s) => s.createAdminOrder);
  const updateAdminOrder = useOrdersStore((s) => s.updateAdminOrder);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState({
    kind: "sell",
    status: "Paid",
    payment_method: "cash",
    customer_name: "",
    customer_phone: "",
    notes: ""
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [localError, setLocalError] = useState("");
  const [formExpanded, setFormExpanded] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchAdminOrders(token).catch(() => {});
    subscribeAdmin(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchAdminOrders, subscribeAdmin, unsubscribe]);

  const stats = useMemo(() => ({
    total: orders.length,
    buy: orders.filter((t) => t.kind === "buy").length,
    sell: orders.filter((t) => t.kind === "sell").length,
    paid: orders.filter((t) => t.status === "Paid").length,
    amountCents: orders.filter((t) => t.status === "Paid").reduce((sum, t) => sum + Number(t.total_cents || 0), 0)
  }), [orders]);

  if (!hydrated || !isAdmin) return <ScreenContainer><CircularProgress message="Checking administrator access..." /></ScreenContainer>;

  const updateLine = (index, patch) => setLines((cur) => cur.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addLine = () => setLines((cur) => [...cur, emptyLine()]);
  const removeLine = (index) => setLines((cur) => (cur.length === 1 ? [emptyLine()] : cur.filter((_, i) => i !== index)));

  const saveField = async (tx, field, value) => {
    if (!token) return;
    const normalized = value == null ? null : String(value).trim();
    const current = tx[field] == null ? null : String(tx[field]);
    if ((normalized || null) === (current || null)) return;
    try {
      await updateAdminOrder(token, tx.id, { [field]: normalized || null });
    } catch (e) {
      showError(e?.message || "Could not update order.");
      throw e;
    }
  };

  const createRecord = async () => {
    setLocalError("");
    try {
      const parsed = orderCreateSchema.safeParse({
        kind: form.kind,
        status: form.status,
        payment_method: form.payment_method,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        notes: form.notes,
        items: lines.map((line) => ({
          item_name: line.item_name,
          quantity: line.quantity,
          unit_price_cents: line.unit_price_cents
        }))
      });

      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path || [];
        const itemIndex = typeof path[1] === "number" ? path[1] : null;
        const field = String(path[path.length - 1] || "");
        const messages = {
          item_name: "name is required.",
          quantity: "quantity must be a positive whole number.",
          unit_price_cents: "unit price must be a non-negative whole number in cents."
        };
        const detail = field === "items" ? "at least one item is required." : (messages[field] || "is invalid.");
        throw new Error(itemIndex != null ? `Item ${itemIndex + 1}: ${detail}` : `Order ${detail}`);
      }

      await createAdminOrder(token, parsed.data);
      setForm({ kind: "sell", status: "Paid", payment_method: "cash", customer_name: "", customer_phone: "", notes: "" });
      setLines([emptyLine()]);
      showSuccess("Order created.");
    } catch (e) {
      const msg = e?.message || "Could not create order.";
      setLocalError(msg);
      showError(msg);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild><Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text></Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Orders</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage all buy/sell orders in one place.</Text>
      </View>
      <Alert variant="error" message={localError || error} />

      <StatGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Buy", value: stats.buy },
          { label: "Sell", value: stats.sell },
          { label: "Paid", value: stats.paid },
          { label: "Paid amount", value: formatCurrencyCents(stats.amountCents) }
        ]}
      />

      <OrdersFormSection
        form={form}
        setForm={setForm}
        lines={lines}
        updateLine={updateLine}
        addLine={addLine}
        removeLine={removeLine}
        syncing={syncing}
        onCreate={createRecord}
        expanded={formExpanded}
        onToggleExpanded={() => setFormExpanded((v) => !v)}
      />

      <SectionHeader
        title="Orders"
        syncing={syncing && orders.length > 0}
        right={<Text className={`font-outfit text-sm ${cx.textInk50}`}>{orders.length} total</Text>}
      />

      <OrdersTableSection orders={orders} loading={loading} syncing={syncing} onSaveField={saveField} />
    </ScreenContainer>
  );
}
