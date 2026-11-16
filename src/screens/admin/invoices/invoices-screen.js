import { useEffect, useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { Header } from "../../../components/header.js";
import { QrCode } from "../../../components/qr-code.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useInvoicesStore } from "../../../stores/invoices-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin invoices management screen.
 * @module screens/admin/invoices/invoices-screen
 */

export default function AdminInvoicesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isAdmin = status === "authenticated" && user?.role === "admin";

  const invoices = useInvoicesStore((s) => s.adminInvoices);
  const loading = useInvoicesStore((s) => s.loading);
  const syncing = useInvoicesStore((s) => s.syncing);
  const error = useInvoicesStore((s) => s.error);
  const fetchAdminInvoices = useInvoicesStore((s) => s.fetchAdminInvoices);
  const updateAdminInvoice = useInvoicesStore((s) => s.updateAdminInvoice);
  const removeAdminInvoice = useInvoicesStore((s) => s.removeAdminInvoice);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (hydrated && isAdmin && token) void fetchAdminInvoices(token).catch(() => {});
  }, [hydrated, isAdmin, token, fetchAdminInvoices]);

  const stats = useMemo(() => ({
    total: invoices.length,
    issued: invoices.filter((i) => i.status === "issued").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    totalCents: invoices.reduce((sum, i) => sum + Number(i.total_cents || 0), 0)
  }), [invoices]);

  if (!hydrated || !isAdmin) return <ScreenContainer><CircularProgress message="Checking administrator access..." /></ScreenContainer>;

  const setInvoiceStatus = async (invoice, newStatus) => {
    try {
      await updateAdminInvoice(token, invoice.id, { status: newStatus });
      showSuccess("Invoice updated.");
    } catch (e) { showError(e?.message || "Could not update invoice."); }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild><Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text></Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Invoices & billing records</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage invoices generated from orders and sales operations.</Text>
      </View>
      <Alert variant="error" message={error} />

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Invoices</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Issued</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.issued}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Paid</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.paid}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Total</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.totalCents / 100).toFixed(2)}</Text></View>
      </View>

      {loading && invoices.length === 0 ? <CircularProgress message="Loading invoices..." /> : null}
      {!loading && invoices.length === 0 ? <EmptyState message="No invoices yet." /> : null}

      <View className="gap-4">
        {invoices.map((inv) => (
          <View key={inv.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>{inv.invoice_number} · ₱{(Number(inv.total_cents || 0) / 100).toFixed(2)}</Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>Status: {inv.status} · Order: {inv.order_id || "-"} · Customer: {inv.customer_id || "-"}</Text>
            <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>Issued: {inv.issue_date || "-"} · Due: {inv.due_date || "-"} · {inv.billing_email || ""}</Text>
            {inv.qr_payload ? <View className="mt-4"><QrCode value={inv.qr_payload} label="Invoice QR" /></View> : null}
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button label="Issued" variant="ghost" onPress={() => void setInvoiceStatus(inv, "issued")} disabled={syncing} />
              <Button label="Paid" variant="secondary" onPress={() => void setInvoiceStatus(inv, "paid")} disabled={syncing} />
              <Button label="Void" variant="ghost" onPress={() => void setInvoiceStatus(inv, "void")} disabled={syncing} />
              <Button label="Delete" variant="ghost" onPress={() => void removeAdminInvoice(token, inv.id).then(() => showSuccess("Invoice deleted.")).catch((e) => showError(e?.message || "Could not delete invoice."))} disabled={syncing} />
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
