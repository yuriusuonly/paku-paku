import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { EmptyState } from "../../components/empty-state.js";
import { Header } from "../../components/header.js";
import { QrCode } from "../../components/qr-code.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { useNotificationStore } from "../../stores/notification.store.js";
import { useTransactionsStore } from "../../stores/transactions.store.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer transactions screen (unified buy/sell records).
 * @module screens/transactions/transactions.screen
 */

export default function TransactionsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isCustomer = status === "authenticated" && user && user.role !== "admin";
  const transactions = useTransactionsStore((s) => s.myTransactions);
  const loading = useTransactionsStore((s) => s.loading);
  const syncing = useTransactionsStore((s) => s.syncing);
  const error = useTransactionsStore((s) => s.error);
  const fetchMyTransactions = useTransactionsStore((s) => s.fetchMyTransactions);
  const subscribeMy = useTransactionsStore((s) => s.subscribeMy);
  const unsubscribe = useTransactionsStore((s) => s.unsubscribe);
  const updateMyTransaction = useTransactionsStore((s) => s.updateMyTransaction);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (!hydrated || !isCustomer || !token) return;
    void fetchMyTransactions(token).catch(() => {});
    subscribeMy(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isCustomer, token, fetchMyTransactions, subscribeMy, unsubscribe]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading transactions..." /></ScreenContainer>;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`${cx.typography.heading} ${cx.textInk}`}>Transactions</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
        Your buy/sell transactions. Present the QR code at the counter for pending transactions.
      </Text>
      <Alert variant="error" message={error} />

      {loading && transactions.length === 0 ? <View className="mt-6"><CircularProgress message="Loading transactions..." /></View> : null}
      {!loading && transactions.length === 0 ? (
        <View className="mt-6 gap-4">
          <EmptyState message="No transactions yet." />
          <Link href="/menu" asChild><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text></Link>
        </View>
      ) : null}

      <View className="mt-6 gap-4">
        {transactions.map((tx) => (
          <View key={tx.id} className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad}`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>
              {tx.order_number} · {formatCurrencyCents(tx.total_cents)}
            </Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              {tx.kind === "sell" ? "Sell" : "Buy"} · Status: {tx.status} · Payment: {tx.payment_status}
              {tx.payment_method ? ` (${tx.payment_method})` : ""} · {new Date(tx.created_at).toLocaleString()}
            </Text>
            {(tx.items || []).length ? (
              <View className="mt-2 gap-1">
                {tx.items.map((item) => (
                  <Text key={item.id} className={`font-outfit text-sm ${cx.textInk70}`}>
                    • {item.item_name} × {item.quantity} = {formatCurrencyCents(item.line_total_cents)}
                  </Text>
                ))}
              </View>
            ) : null}
            {tx.notes ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{tx.notes}</Text> : null}
            {tx.qr_payload ? <View className="mt-4"><QrCode value={tx.qr_payload} label="Transaction QR for counter" /></View> : null}
            {tx.status === "pending" ? (
              <View className="mt-3 flex-row gap-2">
                <Button
                  label="Cancel transaction"
                  variant="ghost"
                  disabled={syncing}
                  onPress={() => void updateMyTransaction(token, tx.id, { status: "cancelled" })
                    .then(() => showSuccess("Transaction cancelled."))
                    .catch((e) => showError(e?.message || "Could not cancel transaction."))}
                />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
