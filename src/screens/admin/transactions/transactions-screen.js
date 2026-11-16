import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { useTransactionsStore } from "../../../stores/transactions-store.js";
import { cx } from "../../../shared/constants/theme.js";

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
  const createAdminTransaction = useTransactionsStore((s) => s.createAdminTransaction);
  const updateAdminTransaction = useTransactionsStore((s) => s.updateAdminTransaction);
  const removeAdminTransaction = useTransactionsStore((s) => s.removeAdminTransaction);
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

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (hydrated && isAdmin && token) void fetchAdminTransactions(token).catch(() => {});
  }, [hydrated, isAdmin, token, fetchAdminTransactions]);

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

  const setTx = async (tx, patch, message) => {
    try {
      await updateAdminTransaction(token, tx.id, patch);
      showSuccess(message);
    } catch (e) {
      showError(e?.message || "Could not update the transaction.");
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
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed amount</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.amountCents / 100).toFixed(2)}</Text></View>
      </View>

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 gap-3`}>
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Create transaction</Text>
        <View className="flex-row flex-wrap gap-2">
          {["buy", "sell"].map((v) => (
            <Button key={v} label={v} variant={form.kind === v ? "secondary" : "ghost"} onPress={() => setForm((f) => ({ ...f, kind: v }))} />
          ))}
        </View>
        <TextField label="Status" value={form.status} onChangeText={(v) => setForm((f) => ({ ...f, status: v }))} placeholder="pending, confirmed, preparing, completed, cancelled" />
        <TextField label="Payment status" value={form.payment_status} onChangeText={(v) => setForm((f) => ({ ...f, payment_status: v }))} placeholder="unpaid, paid, refunded, partial" />
        <TextField label="Payment method" value={form.payment_method} onChangeText={(v) => setForm((f) => ({ ...f, payment_method: v }))} placeholder="cash, card, gcash..." />
        <TextField label="Customer name" value={form.customer_name} onChangeText={(v) => setForm((f) => ({ ...f, customer_name: v }))} placeholder="Optional" />
        <TextField label="Customer phone" value={form.customer_phone} onChangeText={(v) => setForm((f) => ({ ...f, customer_phone: v }))} placeholder="Optional" />
        <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes" multiline numberOfLines={3} />

        <Text className={`font-outfit mt-2 text-base font-bold ${cx.textInk}`}>Line items</Text>
        {lines.map((line, index) => (
          <View key={index} className={`rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4 gap-2`}>
            <View className="flex-row items-center justify-between">
              <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Item {index + 1}</Text>
              <Button label="Remove" variant="ghost" onPress={() => removeLine(index)} disabled={syncing} />
            </View>
            <TextField label="Item name (*)" value={line.item_name} onChangeText={(v) => updateLine(index, { item_name: v })} placeholder="Item name" />
            <TextField label="Quantity (*)" value={line.quantity} onChangeText={(v) => updateLine(index, { quantity: v })} keyboardType="numeric" />
            <TextField label="Unit price (cents) (*)" value={line.unit_price_cents} onChangeText={(v) => updateLine(index, { unit_price_cents: v })} keyboardType="numeric" />
            <TextField label="Menu item ID" value={line.menu_item_id} onChangeText={(v) => updateLine(index, { menu_item_id: v })} placeholder="Optional" />
            <TextField label="Inventory item ID" value={line.inventory_item_id} onChangeText={(v) => updateLine(index, { inventory_item_id: v })} placeholder="Optional (decrements on completed sell)" />
          </View>
        ))}
        <View className="flex-row flex-wrap gap-3">
          <Button label="Add item" variant="ghost" onPress={addLine} disabled={syncing} />
          <Button label="Create transaction" onPress={createRecord} loading={syncing} />
        </View>
      </View>

      {loading && transactions.length === 0 ? <CircularProgress message="Loading transactions..." /> : null}
      {!loading && transactions.length === 0 ? <EmptyState message="No transactions yet." /> : null}

      {transactions.length > 0 ? (
        <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-4 md:p-5`}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ minWidth: 1100 }}>
              <View className={`flex-row border-b ${cx.borderSubtle} pb-2`}>
                {[
                  ["ID", 260],
                  ["Kind", 80],
                  ["Status", 120],
                  ["Payment", 140],
                  ["Total", 110],
                  ["Customer", 180],
                  ["Created", 180],
                  ["Items", 260],
                  ["Actions", 360]
                ].map(([label, width]) => (
                  <View key={label} style={{ width }}>
                    <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{label}</Text>
                  </View>
                ))}
              </View>

              <View className="gap-2 pt-2">
                {transactions.map((tx) => (
                  <View key={tx.id} className={`flex-row items-start border-b ${cx.borderSubtle} py-3`}>
                    <View style={{ width: 260, paddingRight: 8 }}>
                      <Text selectable className={`font-outfit text-xs ${cx.textInk}`}>{tx.id}</Text>
                    </View>
                    <View style={{ width: 80, paddingRight: 8 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk}`}>{tx.kind === "sell" ? "Sell" : "Buy"}</Text>
                    </View>
                    <View style={{ width: 120, paddingRight: 8 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk}`}>{tx.status || "-"}</Text>
                    </View>
                    <View style={{ width: 140, paddingRight: 8 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk}`}>
                        {tx.payment_status || "-"}{tx.payment_method ? ` (${tx.payment_method})` : ""}
                      </Text>
                    </View>
                    <View style={{ width: 110, paddingRight: 8 }}>
                      <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>₱{(Number(tx.total_cents || 0) / 100).toFixed(2)}</Text>
                    </View>
                    <View style={{ width: 180, paddingRight: 8 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk}`}>{tx.customer_name || tx.customer_email || "-"}</Text>
                    </View>
                    <View style={{ width: 180, paddingRight: 8 }}>
                      <Text className={`font-outfit text-xs ${cx.textInk70}`}>{new Date(tx.created_at).toLocaleString()}</Text>
                    </View>
                    <View style={{ width: 260, paddingRight: 8 }}>
                      {(tx.items || []).length ? (
                        <View className="gap-1">
                          {tx.items.map((item) => (
                            <Text key={item.id} className={`font-outfit text-xs ${cx.textInk70}`}>
                              • {item.item_name} × {item.quantity} (₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)})
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text className={`font-outfit text-xs ${cx.textInk60}`}>-</Text>
                      )}
                      {tx.notes ? <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>Note: {tx.notes}</Text> : null}
                    </View>
                    <View style={{ width: 360 }}>
                      <View className="flex-row flex-wrap gap-2">
                        <Button label="Confirm" variant="ghost" onPress={() => void setTx(tx, { status: "confirmed" }, "Transaction confirmed.")} disabled={syncing} />
                        <Button label="Complete" variant="ghost" onPress={() => void setTx(tx, { status: "completed", payment_status: "paid" }, "Transaction completed.")} disabled={syncing} />
                        <Button label="Cancel" variant="ghost" onPress={() => void setTx(tx, { status: "cancelled" }, "Transaction cancelled.")} disabled={syncing} />
                        <Button label="Mark paid" variant="secondary" onPress={() => void setTx(tx, { payment_status: "paid" }, "Marked as paid.")} disabled={syncing} />
                        <Button label="Delete" variant="ghost" onPress={() => void removeAdminTransaction(token, tx.id).then(() => showSuccess("Transaction deleted.")).catch((e) => showError(e?.message || "Could not delete."))} disabled={syncing} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </ScreenContainer>
  );
}
