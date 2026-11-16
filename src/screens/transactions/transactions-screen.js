import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { EmptyState } from "../../components/empty-state.js";
import { Header } from "../../components/header.js";
import { QrCode } from "../../components/qr-code.js";
import { ScreenContainer } from "../../components/container.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useTransactionsStore } from "../../stores/transactions-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer transactions/records screen.
 * @module screens/transactions/transactions-screen
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
  const error = useTransactionsStore((s) => s.error);
  const fetchMyTransactions = useTransactionsStore((s) => s.fetchMyTransactions);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (hydrated && isCustomer && token) void fetchMyTransactions(token).catch(() => {});
  }, [hydrated, isCustomer, token, fetchMyTransactions]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading records..." /></ScreenContainer>;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Transactions & records</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Your payment transactions and account records.</Text>
      <Alert variant="error" message={error} />

      {loading && transactions.length === 0 ? <View className="mt-6"><CircularProgress message="Loading records..." /></View> : null}
      {!loading && transactions.length === 0 ? <View className="mt-6"><EmptyState message="No transaction records yet." /></View> : null}

      <View className="mt-6 gap-4">
        {transactions.map((tx) => (
          <View key={tx.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>
              {tx.transaction_number} · ₱{(Number(tx.amount_cents || 0) / 100).toFixed(2)}
            </Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              {tx.type} · {tx.status} · {tx.method || "-"} · {new Date(tx.created_at).toLocaleString()}
            </Text>
            <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>
              Order: {tx.order_id || "-"} · Invoice: {tx.invoice_id || "-"} · Ref: {tx.reference || "-"}
            </Text>
            {tx.notes ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{tx.notes}</Text> : null}
            {tx.qr_payload ? <View className="mt-4"><QrCode value={tx.qr_payload} label="Record QR" /></View> : null}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
