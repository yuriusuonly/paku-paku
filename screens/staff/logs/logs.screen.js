import { useEffect, useMemo } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { DataTable } from "../../../components/table.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { useStaffOrdersStore } from "../../../stores/staff-orders.store.js";
import { ORDER_STATUSES } from "../../../domain/orders/constants.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Staff order logs screen.
 * @module screens/staff/logs/logs.screen
 */

const columns = [
  { key: "order_number", label: "Reference", width: 180 },
  { key: "status", label: "Status", width: 150 },
  { key: "payment_method", label: "Payment", width: 140 },
  { key: "total", label: "Total", width: 110 },
  { key: "customer_name", label: "Customer", width: 170 },
  { key: "notes", label: "Notes", width: 200 },
  { key: "created_at", label: "Placed", width: 180 },
  { key: "items", label: "Items", width: 280 }
];

/**
 * @returns {JSX.Element} Staff order logs screen.
 */
export default function StaffLogsScreen() {
  const session = useAuthStore((s) => s.session);
  const token = session?.access_token;

  const orders = useStaffOrdersStore((s) => s.orders);
  const loading = useStaffOrdersStore((s) => s.logsLoading);
  const error = useStaffOrdersStore((s) => s.error);
  const fetchLogs = useStaffOrdersStore((s) => s.fetchLogs);
  const setStatus = useStaffOrdersStore((s) => s.setStatus);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  useEffect(() => {
    if (!token) return;
    void fetchLogs(token).catch(() => {});
  }, [token, fetchLogs]);

  const stats = useMemo(() => ({
    total: orders.length,
    paid: orders.filter((order) => order.status === "Paid").length,
    pending: orders.filter((order) => order.status === "Pending").length,
    amountCents: orders.filter((order) => order.status === "Paid").reduce((sum, order) => sum + Number(order.total_cents || 0), 0)
  }), [orders]);

  const onChangeStatus = async (order, status) => {
    if (!token || order.status === status) return;
    try {
      await setStatus(token, order.id, status);
      showSuccess(`Order ${order.order_number} marked ${status.toLowerCase()}.`);
    } catch (e) {
      showError(e?.message || "Could not update the order.");
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <View className="mb-6">
        <Link href="/staff/order" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to order taking</Text>
        </Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Order logs</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Review every order and update its status from one place.</Text>
      </View>

      <Alert variant="error" message={error} />

      <StatGrid
        stats={[
          { label: "Total orders", value: stats.total },
          { label: "Paid", value: stats.paid },
          { label: "Pending", value: stats.pending },
          { label: "Paid amount", value: formatCurrencyCents(stats.amountCents) }
        ]}
        className="mb-6"
      />

      <DataTable
        columns={columns}
        rows={orders}
        loading={loading && orders.length === 0}
        loadingMessage="Loading order logs..."
        emptyMessage="No orders have been placed yet."
        renderCell={(order, column) => {
          switch (column.key) {
            case "status":
              return (
                <InlineSelect
                  value={order.status || "Pending"}
                  options={ORDER_STATUSES}
                  accessibilityLabel={`Order status for ${order.order_number}`}
                  onChange={(value) => void onChangeStatus(order, value)}
                />
              );
            case "total":
              return (
                <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
                  {formatCurrencyCents(order.total_cents)}
                </Text>
              );
            case "created_at":
              return <Text className={`font-outfit text-sm ${cx.textInk70}`}>{formatAuditTimestamp(order.created_at)}</Text>;
            case "items":
              if (!Array.isArray(order.items) || order.items.length === 0) {
                return <Text className={`font-outfit text-sm ${cx.textInk70}`}>-</Text>;
              }
              return (
                <View className="gap-1">
                  {order.items.map((item, index) => (
                    <Text key={item.id || index} className={`font-outfit text-xs ${cx.textInk70}`}>
                      • {item.item_name} × {item.quantity} ({formatCurrencyCents(item.line_total_cents)})
                    </Text>
                  ))}
                </View>
              );
            default:
              return (
                <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>
                  {String(order[column.key] ?? "-")}
                </Text>
              );
          }
        }}
      />
    </ScreenContainer>
  );
}
