import { Text, View } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableScroll } from "../../../components/table.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin transactions table section with inline editing.
 * @module screens/admin/transactions/transactions-table-component
 */

const STATUS_OPTIONS = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const PAYMENT_OPTIONS = ["unpaid", "paid", "partial", "refunded"];
const KIND_OPTIONS = ["buy", "sell"];

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

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function TransactionsTableSection({ transactions, loading, syncing, onSaveField }) {
  const showInitialLoading = loading && transactions.length === 0;

  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading transactions..." /> : null}

      {!loading && transactions.length === 0 ? (
        <EmptyState message="No transactions yet." />
      ) : null}

      {transactions.length > 0 ? (
        <TableScroll syncing={syncing}>
          <Table>
            <TableHeader>
              {columns.map((column, index) => (
                <TableHeaderCell key={column.key} width={column.width} last={index === columns.length - 1}>
                  {column.label}
                </TableHeaderCell>
              ))}
            </TableHeader>
            <TableBody>
              {transactions.map((tx, rowIndex) => {
                const rowKey = String(tx.id ?? `row-${rowIndex}`);
                return (
                  <TableRow key={rowKey} last={rowIndex === transactions.length - 1}>
                    {columns.map((column, index) => {
                      const last = index === columns.length - 1;
                      return (
                        <TableCell key={`${rowKey}-${column.key}`} width={column.width} last={last}>
                          {column.key === "id" ? (
                            <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>{tx.id}</Text>
                          ) : column.key === "kind" ? (
                            <InlineSelect value={tx.kind || "buy"} options={KIND_OPTIONS} onChange={(v) => onSaveField(tx, "kind", v)} />
                          ) : column.key === "status" ? (
                            <InlineSelect value={tx.status || "pending"} options={STATUS_OPTIONS} onChange={(v) => onSaveField(tx, "status", v)} />
                          ) : column.key === "payment_status" ? (
                            <InlineSelect value={tx.payment_status || "unpaid"} options={PAYMENT_OPTIONS} onChange={(v) => onSaveField(tx, "payment_status", v)} />
                          ) : column.key === "payment_method" ? (
                            <InlineEditableCell value={tx.payment_method} placeholder="method" onSave={(v) => onSaveField(tx, "payment_method", v)} />
                          ) : column.key === "total" ? (
                            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>{formatCurrencyCents(tx.total_cents)}</Text>
                          ) : column.key === "customer_name" ? (
                            <InlineEditableCell value={tx.customer_name} placeholder="name" onSave={(v) => onSaveField(tx, "customer_name", v)} />
                          ) : column.key === "customer_email" ? (
                            <InlineEditableCell value={tx.customer_email} placeholder="email" onSave={(v) => onSaveField(tx, "customer_email", v)} />
                          ) : column.key === "customer_phone" ? (
                            <InlineEditableCell value={tx.customer_phone} placeholder="phone" onSave={(v) => onSaveField(tx, "customer_phone", v)} />
                          ) : column.key === "notes" ? (
                            <InlineEditableCell value={tx.notes} placeholder="notes" onSave={(v) => onSaveField(tx, "notes", v)} />
                          ) : column.key === "created_at" ? (
                            <Text className={`font-outfit text-sm ${cx.textInk70}`}>{formatAuditTimestamp(tx.created_at)}</Text>
                          ) : (
                            (tx.items || []).length ? (
                              <View className="gap-1">
                                {tx.items.map((item) => (
                                  <Text key={item.id} className={`font-outfit text-xs ${cx.textInk70}`}>
                                    • {item.item_name} × {item.quantity} ({formatCurrencyCents(item.line_total_cents)})
                                  </Text>
                                ))}
                              </View>
                            ) : (
                              <Text className={`font-outfit text-sm ${cx.textInk70}`}>-</Text>
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableScroll>
      ) : null}
    </>
  );
}
