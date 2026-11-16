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
import { useInvoicesStore } from "../../stores/invoices-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer invoices screen.
 * @module screens/invoices/invoices-screen
 */

export default function InvoicesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isCustomer = status === "authenticated" && user && user.role !== "admin";
  const invoices = useInvoicesStore((s) => s.myInvoices);
  const loading = useInvoicesStore((s) => s.loading);
  const error = useInvoicesStore((s) => s.error);
  const fetchMyInvoices = useInvoicesStore((s) => s.fetchMyInvoices);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (hydrated && isCustomer && token) void fetchMyInvoices(token).catch(() => {});
  }, [hydrated, isCustomer, token, fetchMyInvoices]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading invoices..." /></ScreenContainer>;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Invoices</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>View your billing invoices and records.</Text>
      <Alert variant="error" message={error} />

      {loading && invoices.length === 0 ? <View className="mt-6"><CircularProgress message="Loading invoices..." /></View> : null}
      {!loading && invoices.length === 0 ? <View className="mt-6"><EmptyState message="No invoices yet. Invoices are generated when you place orders." /></View> : null}

      <View className="mt-6 gap-4">
        {invoices.map((inv) => (
          <View key={inv.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>
              {inv.invoice_number} · ₱{(Number(inv.total_cents || 0) / 100).toFixed(2)}
            </Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              Status: {inv.status} · Issued: {inv.issue_date || "-"} · Currency: {inv.currency || "PHP"}
            </Text>
            <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>
              Order: {inv.order_id || "-"} · {inv.billing_name || inv.billing_email || "Customer"}
            </Text>
            {inv.notes ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{inv.notes}</Text> : null}
            {inv.qr_payload ? <View className="mt-4"><QrCode value={inv.qr_payload} label="Invoice QR" /></View> : null}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
