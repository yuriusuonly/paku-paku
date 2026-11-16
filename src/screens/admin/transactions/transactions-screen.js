import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { Header } from "../../../components/header.js";
import { QrCode } from "../../../components/qr-code.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { useTransactionsStore } from "../../../stores/transactions-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin transactions and records management screen.
 * @module screens/admin/transactions/transactions-screen
 */

const emptyForm = { type: "payment", method: "cash", status: "completed", amount_cents: "0", reference: "", notes: "", order_id: "", invoice_id: "" };

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
  const createAdminTransaction = useTransactionsStore((s) => s.createAdminTransaction);
  const updateAdminTransaction = useTransactionsStore((s) => s.updateAdminTransaction);
  const removeAdminTransaction = useTransactionsStore((s) => s.removeAdminTransaction);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (hydrated && isAdmin && token) void fetchAdminTransactions(token).catch(() => {});
  }, [hydrated, isAdmin, token, fetchAdminTransactions]);

  const stats = useMemo(() => ({
    total: transactions.length,
    completed: transactions.filter((t) => t.status === "completed").length,
    amountCents: transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + Number(t.amount_cents || 0), 0)
  }), [transactions]);

  if (!hydrated || !isAdmin) return <ScreenContainer><CircularProgress message="Checking administrator access..." /></ScreenContainer>;

  const createRecord = async () => {
    setLocalError("");
    const amount = Number(form.amount_cents);
    if (!Number.isInteger(amount) || amount < 0) {
      setLocalError("Amount must be a non-negative whole number in cents.");
      return;
    }
    try {
      await createAdminTransaction(token, {
        ...form,
        amount_cents: amount,
        order_id: form.order_id.trim() || null,
        invoice_id: form.invoice_id.trim() || null,
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null
      });
      setForm(emptyForm);
      showSuccess("Transaction record created.");
    } catch (e) {
      const msg = e?.message || "Could not create transaction record.";
      setLocalError(msg);
      showError(msg);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild><Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text></Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Transactions & records</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage payment transactions and operational financial records.</Text>
      </View>
      <Alert variant="error" message={localError || error} />

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Records</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.completed}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed amount</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.amountCents / 100).toFixed(2)}</Text></View>
      </View>

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 gap-3`}>
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Add transaction record</Text>
        <TextField label="Type" value={form.type} onChangeText={(v) => setForm((f) => ({ ...f, type: v }))} placeholder="payment, refund, adjustment, charge" />
        <TextField label="Method" value={form.method} onChangeText={(v) => setForm((f) => ({ ...f, method: v }))} placeholder="cash, card, gcash..." />
        <TextField label="Status" value={form.status} onChangeText={(v) => setForm((f) => ({ ...f, status: v }))} placeholder="pending, completed, failed, cancelled, refunded" />
        <TextField label="Amount (cents)" value={form.amount_cents} onChangeText={(v) => setForm((f) => ({ ...f, amount_cents: v }))} keyboardType="numeric" />
        <TextField label="Order ID" value={form.order_id} onChangeText={(v) => setForm((f) => ({ ...f, order_id: v }))} placeholder="Optional" />
        <TextField label="Invoice ID" value={form.invoice_id} onChangeText={(v) => setForm((f) => ({ ...f, invoice_id: v }))} placeholder="Optional" />
        <TextField label="Reference" value={form.reference} onChangeText={(v) => setForm((f) => ({ ...f, reference: v }))} placeholder="Optional reference" />
        <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes" multiline numberOfLines={3} />
        <View className="flex-row gap-3"><Button label="Create record" onPress={createRecord} loading={syncing} /><Button label="Clear" variant="ghost" onPress={() => setForm(emptyForm)} /></View>
      </View>

      {loading && transactions.length === 0 ? <CircularProgress message="Loading records..." /> : null}
      {!loading && transactions.length === 0 ? <EmptyState message="No transaction records yet." /> : null}

      <View className="gap-4">
        {transactions.map((tx) => (
          <View key={tx.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>{tx.transaction_number} · ₱{(Number(tx.amount_cents || 0) / 100).toFixed(2)}</Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>{tx.type} · {tx.status} · {tx.method || "-"} · {new Date(tx.created_at).toLocaleString()}</Text>
            <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>Order: {tx.order_id || "-"} · Invoice: {tx.invoice_id || "-"} · Ref: {tx.reference || "-"}</Text>
            {tx.notes ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{tx.notes}</Text> : null}
            {tx.qr_payload ? <View className="mt-4"><QrCode value={tx.qr_payload} label="Record QR" /></View> : null}
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button label="Mark completed" variant="ghost" onPress={() => void updateAdminTransaction(token, tx.id, { status: "completed" }).then(() => showSuccess("Transaction updated.")).catch((e) => showError(e?.message || "Could not update."))} disabled={syncing} />
              <Button label="Mark failed" variant="ghost" onPress={() => void updateAdminTransaction(token, tx.id, { status: "failed" }).then(() => showSuccess("Transaction updated.")).catch((e) => showError(e?.message || "Could not update."))} disabled={syncing} />
              <Button label="Delete" variant="secondary" onPress={() => void removeAdminTransaction(token, tx.id).then(() => showSuccess("Transaction deleted.")).catch((e) => showError(e?.message || "Could not delete."))} disabled={syncing} />
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
