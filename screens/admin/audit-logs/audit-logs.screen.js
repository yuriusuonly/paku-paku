import { useEffect, useMemo } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { DataTable } from "../../../components/table.js";
import { StatusPill } from "../../../components/status-pill.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useAuditLogsStore } from "../../../stores/audit-logs.store.js";
import { getAuditActor, getAuditSummary } from "../../../domain/audit/summary.js";
import { formatAuditTimestamp } from "../../../format/date.js";
import { cx } from "../../../constants/theme.js";

/**
 * Admin audit log screen.
 * @module screens/admin/audit-logs/audit-logs.screen
 */

const columns = [
  { key: "created_at", label: "Time", width: 200 },
  { key: "action", label: "Action", width: 120 },
  { key: "table_name", label: "Table", width: 140 },
  { key: "summary", label: "Record", width: 260 },
  { key: "actor_email", label: "Actor", width: 220 },
  { key: "record_id", label: "Record ID", width: 280 }
];

/**
 * @returns {JSX.Element} Audit log screen.
 */
export default function AuditLogsScreen() {
  const session = useAuthStore((s) => s.session);

  const logs = useAuditLogsStore((s) => s.logs);
  const loading = useAuditLogsStore((s) => s.loading);
  const syncing = useAuditLogsStore((s) => s.syncing);
  const error = useAuditLogsStore((s) => s.error);
  const fetchLogs = useAuditLogsStore((s) => s.fetchLogs);
  const subscribe = useAuditLogsStore((s) => s.subscribe);
  const unsubscribe = useAuditLogsStore((s) => s.unsubscribe);

  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    void fetchLogs(token).catch(() => {});
    subscribe(token);
    return () => { void unsubscribe(); };
  }, [token, fetchLogs, subscribe, unsubscribe]);

  const stats = useMemo(() => ({
    total: logs.length,
    creates: logs.filter((log) => log.action === "INSERT").length,
    updates: logs.filter((log) => log.action === "UPDATE").length,
    deletes: logs.filter((log) => log.action === "DELETE").length
  }), [logs]);

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text>
        </Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Audit logs</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Recent staff and kiosk changes across profiles, items, and orders.
        </Text>
      </View>

      <Alert variant="error" message={error} />

      <StatGrid
        stats={[
          { label: "Events", value: stats.total },
          { label: "Creates", value: stats.creates },
          { label: "Updates", value: stats.updates },
          { label: "Deletes", value: stats.deletes }
        ]}
      />

      <SectionHeader title="Activity" syncing={syncing} className="mt-6" />

      <DataTable
        columns={columns}
        rows={logs}
        loading={loading && logs.length === 0}
        syncing={syncing}
        error={error}
        loadingMessage="Loading audit logs..."
        emptyMessage="No audit activity recorded yet."
        renderCell={(log, column) => {
          const key = column.key;
          if (key === "action") {
            const variant = log.action === "INSERT" ? "success" : log.action === "DELETE" ? "danger" : "info";
            return <StatusPill label={String(log.action)} variant={variant} />;
          }
          const value = key === "summary"
            ? getAuditSummary(log)
            : key === "actor_email"
              ? getAuditActor(log)
              : key === "created_at"
                ? formatAuditTimestamp(log.created_at)
                : String(log[key] ?? "-");
          return (
            <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>
              {value}
            </Text>
          );
        }}
      />
    </ScreenContainer>
  );
}
