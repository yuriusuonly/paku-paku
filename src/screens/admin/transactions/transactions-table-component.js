import { Text, View } from "react-native";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { DataTable } from "../../../components/table.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import {
  KIND_OPTIONS,
  PAYMENT_STATUSES,
  TRANSACTION_STATUSES
} from "../../../shared/constants/domain.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin transactions table section with inline editing.
 * @module screens/admin/transactions/transactions-table-component
 */

const columns = [
  { key: "id", label: "ID", width: 260 },
  { key: "kind", label: "Kind", width: 120 },
  { key: "status", label: "Status", width: 160 },
  { key: "payment_status", label: "Payment status", width: 160 },
  { key: "payment_method", label: "Payment method", width: 160 },
  { key: "total", label: "Total", width: 110 },
  { key: "customer_name", label: "Customer name", width: 180 },
  { key: "customer_email", label: "Customer email", width: 220 },
  { key: "customer_phone", label: "Customer phone", width: 160 },
  { key: "notes", label: "Notes", width: 220 },
  { key: "created_at", label: "Created", width: 180 },
  { key: "items", label: "Items", width: 260 }
];

const editableKeys = new Set(["payment_method", "customer_name", "customer_email", "customer_phone", "notes"]);

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function TransactionsTableSection({ transactions, loading, syncing, onSaveField }) {
  return (
    <DataTable
      columns={columns}
      rows={transactions}
      loading={loading && transactions.length === 0}
      syncing={syncing}
      loadingMessage="Loading transactions..."
      emptyMessage="No transactions yet."
      renderCell={(tx, column) => {
        const key = column.key;

        if (key === "kind") {
          return (
            <InlineSelect
              value={tx.kind || "buy"}
              options={KIND_OPTIONS}
              accessibilityLabel="Transaction kind"
              onChange={(value) => onSaveField(tx, key, value)}
            />
          );
        }

        if (key === "status") {
          return (
            <InlineSelect
              value={tx.status || "pending"}
              options={TRANSACTION_STATUSES}
              accessibilityLabel="Transaction status"
              onChange={(value) => onSaveField(tx, key, value)}
            />
          );
        }

        if (key === "payment_status") {
          return (
            <InlineSelect
              value={tx.payment_status || "unpaid"}
              options={PAYMENT_STATUSES}
              accessibilityLabel="Payment status"
              onChange={(value) => onSaveField(tx, key, value)}
            />
          );
        }

        if (editableKeys.has(key)) {
          return (
            <InlineEditableCell
              value={tx[key] ?? ""}
              placeholder={key.replace(/_/g, " ")}
              onSave={(value) => onSaveField(tx, key, value)}
            />
          );
        }

        if (key === "total") {
          return (
            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
              {formatCurrencyCents(tx.total_cents)}
            </Text>
          );
        }

        if (key === "created_at") {
          return <Text className={`font-outfit text-sm ${cx.textInk70}`}>{formatAuditTimestamp(tx.created_at)}</Text>;
        }

        if (key === "items") {
          if (!Array.isArray(tx.items) || tx.items.length === 0) {
            return <Text className={`font-outfit text-sm ${cx.textInk70}`}>-</Text>;
          }
          return (
            <View className="gap-1">
              {tx.items.map((item) => (
                <Text key={item.id} className={`font-outfit text-xs ${cx.textInk70}`}>
                  • {item.item_name} × {item.quantity} ({formatCurrencyCents(item.line_total_cents)})
                </Text>
              ))}
            </View>
          );
        }

        return (
          <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>
            {String(tx.id ?? "-")}
          </Text>
        );
      }}
    />
  );
}
