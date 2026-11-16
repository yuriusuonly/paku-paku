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
import { useNotificationStore } from "../../../stores/notification-store.js";
import { useOrdersStore } from "../../../stores/orders-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin orders management screen.
 * @module screens/admin/orders/orders-screen
 */

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
  const updateAdminOrder = useOrdersStore((s) => s.updateAdminOrder);
  const removeAdminOrder = useOrdersStore((s) => s.removeAdminOrder);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (hydrated && isAdmin && token) void fetchAdminOrders(token).catch(() => {});
  }, [hydrated, isAdmin, token, fetchAdminOrders]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    completed: orders.filter((o) => o.status === "completed").length,
    revenueCents: orders.filter((o) => o.payment_status === "paid").reduce((sum, o) => sum + Number(o.total_cents || 0), 0)
  }), [orders]);

  if (!hydrated || !isAdmin) return <ScreenContainer><CircularProgress message="Checking administrator access..." /></ScreenContainer>;

  const setStatus = async (order, patch, message) => {
    try {
      await updateAdminOrder(token, order.id, patch);
      showSuccess(message);
    } catch (e) { showError(e?.message || "Could not update the order."); }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild><Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text></Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Orders management</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage customer orders, fulfillment status, and payment state.</Text>
      </View>
      <Alert variant="error" message={error} />

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Orders</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Pending</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.pending}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.completed}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Paid revenue</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.revenueCents / 100).toFixed(2)}</Text></View>
      </View>

      {loading && orders.length === 0 ? <CircularProgress message="Loading orders..." /> : null}
      {!loading && orders.length === 0 ? <EmptyState message="No orders yet." /> : null}

      <View className="gap-4">
        {orders.map((order) => (
          <View key={order.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>{order.order_number} · ₱{(Number(order.total_cents || 0) / 100).toFixed(2)}</Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>Customer: {order.customer_name || order.customer_email || order.customer_id} · {new Date(order.created_at).toLocaleString()}</Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>Status: {order.status} · Payment: {order.payment_status}</Text>
            {(order.items || []).length ? (
              <View className="mt-2 gap-1">
                {order.items.map((item) => (
                  <Text key={item.id} className={`font-outfit text-sm ${cx.textInk70}`}>• {item.item_name} × {item.quantity} = ₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)}</Text>
                ))}
              </View>
            ) : null}
            {order.qr_payload ? <View className="mt-4"><QrCode value={order.qr_payload} label="Order QR" /></View> : null}
            <View className="mt-3 flex-row flex-wrap gap-2">
              <Button label="Confirm" variant="ghost" onPress={() => void setStatus(order, { status: "confirmed" }, "Order confirmed.")} disabled={syncing} />
              <Button label="Preparing" variant="ghost" onPress={() => void setStatus(order, { status: "preparing" }, "Order preparing.")} disabled={syncing} />
              <Button label="Complete" variant="ghost" onPress={() => void setStatus(order, { status: "completed", payment_status: "paid" }, "Order completed.")} disabled={syncing} />
              <Button label="Cancel" variant="ghost" onPress={() => void setStatus(order, { status: "cancelled" }, "Order cancelled.")} disabled={syncing} />
              <Button label="Mark paid" variant="secondary" onPress={() => void setStatus(order, { payment_status: "paid" }, "Order marked as paid.")} disabled={syncing} />
              <Button label="Delete" variant="ghost" onPress={() => void removeAdminOrder(token, order.id).then(() => showSuccess("Order deleted.")).catch((e) => showError(e?.message || "Could not delete order."))} disabled={syncing} />
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
