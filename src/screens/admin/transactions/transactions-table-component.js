import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
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

function InlineEditableCell({ value, onSave, placeholder = "" }) {
  const stringValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(stringValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(stringValue);
  }, [stringValue, focused]);

  const commit = async () => {
    setFocused(false);
    if (draft === stringValue) return;
    try {
      await onSave(draft);
    } catch {
      setDraft(stringValue);
    }
  };

  return (
    <TextInput
      value={draft}
      onChangeText={setDraft}
      onFocus={() => setFocused(true)}
      onBlur={() => { void commit(); }}
      onSubmitEditing={() => { void commit(); }}
      placeholder={placeholder}
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm font-bold ${cx.textInk}`}
    />
  );
}

function InlineSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const current = value == null || value === "" ? "-" : String(value);
  return (
    <View style={{ position: "relative" }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className={`rounded-lg border ${open ? cx.borderPrimary30 : cx.borderSubtle} ${cx.bgSurfaceSoft} px-2 py-1`}
      >
        <Text className={`font-outfit text-sm font-bold ${cx.textInk}`}>{current}</Text>
      </Pressable>
      {open ? (
        <View className={`absolute left-0 top-9 z-50 min-w-[140px] rounded-xl border ${cx.borderSubtle} ${cx.bgSurface} p-1 shadow-sm`}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setOpen(false);
                if (option !== value) void onChange(option);
              }}
              className={`rounded-lg px-3 py-2 ${option === value ? cx.bgSurfaceMuted : ""}`}
            >
              <Text className={`font-outfit text-sm ${cx.textInk}`}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          className={`${syncing ? "opacity-80" : "opacity-100"}`}
        >
          <View className={`min-w-full overflow-hidden rounded-2xl border ${cx.borderSubtle}`}>
            <View className={`flex-row ${cx.bgSurfaceSoft}`}>
              {columns.map((column, index) => (
                <View
                  key={column.key}
                  style={{ width: column.width }}
                  className={`justify-center px-4 py-3 ${index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : ""}`}
                >
                  <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>
                    {column.label}
                  </Text>
                </View>
              ))}
            </View>

            {transactions.map((tx, rowIndex) => {
              const rowKey = String(tx.id ?? `row-${rowIndex}`);
              return (
                <View
                  key={rowKey}
                  className={`flex-row ${rowIndex < transactions.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                >
                  {columns.map((column, index) => {
                    const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                    return (
                      <View
                        key={`${rowKey}-${column.key}`}
                        style={{ width: column.width }}
                        className={`justify-center px-4 py-3 ${cellBorder}`}
                      >
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
                          <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>₱{(Number(tx.total_cents || 0) / 100).toFixed(2)}</Text>
                        ) : column.key === "customer_name" ? (
                          <InlineEditableCell value={tx.customer_name} placeholder="name" onSave={(v) => onSaveField(tx, "customer_name", v)} />
                        ) : column.key === "customer_email" ? (
                          <InlineEditableCell value={tx.customer_email} placeholder="email" onSave={(v) => onSaveField(tx, "customer_email", v)} />
                        ) : column.key === "customer_phone" ? (
                          <InlineEditableCell value={tx.customer_phone} placeholder="phone" onSave={(v) => onSaveField(tx, "customer_phone", v)} />
                        ) : column.key === "notes" ? (
                          <InlineEditableCell value={tx.notes} placeholder="notes" onSave={(v) => onSaveField(tx, "notes", v)} />
                        ) : column.key === "created_at" ? (
                          <Text className={`font-outfit text-sm ${cx.textInk70}`}>{tx.created_at ? new Date(tx.created_at).toLocaleString() : "-"}</Text>
                        ) : (
                          (tx.items || []).length ? (
                            <View className="gap-1">
                              {tx.items.map((item) => (
                                <Text key={item.id} className={`font-outfit text-xs ${cx.textInk70}`}>
                                  • {item.item_name} × {item.quantity} (₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)})
                                </Text>
                              ))}
                            </View>
                          ) : (
                            <Text className={`font-outfit text-sm ${cx.textInk70}`}>-</Text>
                          )
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : null}
    </>
  );
}
