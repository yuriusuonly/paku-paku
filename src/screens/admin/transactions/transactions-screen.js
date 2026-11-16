import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { useTransactionsStore } from "../../../stores/transactions-store.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";
import { TransactionsFormSection } from "./transactions-form-component.js";
import { TransactionsTableSection } from "./transactions-table-component.js";

/**
 * Admin unified transactions management screen.
 * @module screens/admin/transactions/transactions-screen
 */

function emptyLine() {
  return { item_name: "", quantity: "1", unit_price_cents: "0", menu_item_id: "", inventory_item_id: "" };
}

export default function AdminTransactionsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isAdmin = status === "authenticated" && user?.role === "admin";

  const transactions = useTransactionsStore((s) => s.adminTransactions);
  const loading = useTransactionsStore((s) => s.loading);
  const syncing = useTransactionsStore((s) => s.syncing);
  const error = useTransactionsStore((s) => s.error);
  const fetchAdminTransactions = useTransactionsStore((s) => s.fetchAdminTransactions);
  const subscribeAdmin = useTransactionsStore((s) => s.subscribeAdmin);
  const unsubscribe = useTransactionsStore((s) => s.unsubscribe);
  const createAdminTransaction = useTransactionsStore((s) => s.createAdminTransaction);
  const updateAdminTransaction = useTransactionsStore((s) => s.updateAdminTransaction);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState({
    kind: "sell",
    status: "completed",
    payment_status: "paid",
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
    void fetchAdminTransactions(token).catch(() => {});
    subscribeAdmin(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchAdminTransactions, subscribeAdmin, unsubscribe]);

  const stats = useMemo(() => ({
    total: transactions.length,
    buy: transactions.filter((t) => t.kind === "buy").length,
    sell: transactions.filter((t) => t.kind === "sell").length,
    completed: transactions.filter((t) => t.status === "completed").length,
    amountCents: transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + Number(t.total_cents || 0), 0)
  }), [transactions]);

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
      await updateAdminTransaction(token, tx.id, { [field]: normalized || null });
    } catch (e) {
      showError(e?.message || "Could not update transaction.");
      throw e;
    }
  };

  const createRecord = async () => {
    setLocalError("");
    try {
      const items = lines.map((line, index) => {
        const itemName = line.item_name.trim();
        const quantity = Number(line.quantity);
        const unitPrice = Number(line.unit_price_cents);
        if (!itemName) throw new Error(`Item ${index + 1}: name is required.`);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Item ${index + 1}: quantity must be a positive whole number.`);
        if (!Number.isInteger(unitPrice) || unitPrice < 0) throw new Error(`Item ${index + 1}: unit price must be a non-negative whole number in cents.`);
        return {
          item_name: itemName,
          quantity,
          unit_price_cents: unitPrice,
          menu_item_id: line.menu_item_id.trim() || null,
          inventory_item_id: line.inventory_item_id.trim() || null
        };
      });
      await createAdminTransaction(token, {
        kind: form.kind,
        status: form.status,
        payment_status: form.payment_status,
        payment_method: form.payment_method.trim() || null,
        customer_name: form.customer_name.trim() || null,
        customer_phone: form.customer_phone.trim() || null,
        notes: form.notes.trim() || null,
        items
      });
      setForm({ kind: "sell", status: "completed", payment_status: "paid", payment_method: "cash", customer_name: "", customer_phone: "", notes: "" });
      setLines([emptyLine()]);
      showSuccess("Transaction created.");
    } catch (e) {
      const msg = e?.message || "Could not create transaction.";
      setLocalError(msg);
      showError(msg);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild><Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text></Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Transactions</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage all buy/sell transactions in one place.</Text>
      </View>
      <Alert variant="error" message={localError || error} />

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Total</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Buy</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.buy}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Sell</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.sell}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.completed}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed amount</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{formatCurrencyCents(stats.amountCents)}</Text></View>
      </View>

      <TransactionsFormSection
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

      <View className="mb-3 flex-row items-center justify-between">
        <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Transactions</Text>
        <View className="flex-row items-center gap-2">
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>{transactions.length} total</Text>
          {syncing && transactions.length > 0 ? <CircularProgress size="small" /> : null}
        </View>
      </View>

      <TransactionsTableSection transactions={transactions} loading={loading} syncing={syncing} onSaveField={saveField} />
    </ScreenContainer>
  );
}
