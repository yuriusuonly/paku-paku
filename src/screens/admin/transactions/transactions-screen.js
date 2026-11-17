import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { useTransactionsStore } from "../../../stores/transactions-store.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";
import { transactionCreateSchema } from "../../../domain/transactions/schema.js";
import { TransactionsFormSection } from "./transactions-form-component.js";
import { TransactionsTableSection } from "./transactions-table-component.js";

/**
 * Admin unified transactions management screen.
 * @module screens/admin/transactions/transactions-screen
 */

function emptyLine() {
  return { item_name: "", quantity: "1", unit_price_cents: "0", menu_item_id: "" };
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
      const parsed = transactionCreateSchema.safeParse({
        kind: form.kind,
        status: form.status,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        notes: form.notes,
        items: lines.map((line) => ({
          item_name: line.item_name,
          quantity: line.quantity,
          unit_price_cents: line.unit_price_cents,
          menu_item_id: line.menu_item_id
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
        throw new Error(itemIndex != null ? `Item ${itemIndex + 1}: ${detail}` : `Transaction ${detail}`);
      }

      await createAdminTransaction(token, parsed.data);
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
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Transactions</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage all buy/sell transactions in one place.</Text>
      </View>
      <Alert variant="error" message={localError || error} />

      <StatGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Buy", value: stats.buy },
          { label: "Sell", value: stats.sell },
          { label: "Completed", value: stats.completed },
          { label: "Completed amount", value: formatCurrencyCents(stats.amountCents) }
        ]}
      />

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

      <SectionHeader
        title="Transactions"
        syncing={syncing && transactions.length > 0}
        right={<Text className={`font-outfit text-sm ${cx.textInk50}`}>{transactions.length} total</Text>}
      />

      <TransactionsTableSection transactions={transactions} loading={loading} syncing={syncing} onSaveField={saveField} />
    </ScreenContainer>
  );
}
