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
import { useAuthStore } from "../../stores/auth-store.js";
import { useOrdersStore } from "../../stores/orders-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer orders screen.
 * @module screens/orders/orders-screen
 */

export default function OrdersScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isCustomer = status === "authenticated" && user && user.role !== "admin";

  const orders = useOrdersStore((s) => s.myOrders);
  const loading = useOrdersStore((s) => s.loading);
  const error = useOrdersStore((s) => s.error);
  const fetchMyOrders = useOrdersStore((s) => s.fetchMyOrders);
  const updateMyOrder = useOrdersStore((s) => s.updateMyOrder);

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (hydrated && isCustomer && token) void fetchMyOrders(token).catch(() => {});
  }, [hydrated, isCustomer, token, fetchMyOrders]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading orders..." /></ScreenContainer>;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>My orders</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Track your orders and show the order QR at the counter when you buy.</Text>
      <Alert variant="error" message={error} />

      {loading && orders.length === 0 ? <View className="mt-6"><CircularProgress message="Loading orders..." /></View> : null}
      {!loading && orders.length === 0 ? (
        <View className="mt-6 gap-4">
          <EmptyState message="You have no orders yet." />
          <Link href="/menu" asChild><Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Browse menu →</Text></Link>
        </View>
      ) : null}

      <View className="mt-6 gap-4">
        {orders.map((order) => (
          <View key={order.id} className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
            <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>
              {order.order_number} · ₱{(Number(order.total_cents || 0) / 100).toFixed(2)}
            </Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              Status: {order.status} · Payment: {order.payment_status} · {new Date(order.created_at).toLocaleString()}
            </Text>
            {(order.items || []).length ? (
              <View className="mt-2 gap-1">
                {order.items.map((item) => (
                  <Text key={item.id} className={`font-outfit text-sm ${cx.textInk70}`}>
                    • {item.item_name} × {item.quantity} = ₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)}
                  </Text>
                ))}
              </View>
            ) : null}
            {order.qr_payload ? <View className="mt-4"><QrCode value={order.qr_payload} label="Order QR" /></View> : null}
            {order.status === "pending" ? (
              <View className="mt-3 flex-row gap-2">
                <Button label="Cancel order" variant="ghost" onPress={() => void updateMyOrder(token, order.id, { status: "cancelled" }).catch(() => {})} />
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}
