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
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm ${cx.textInk}`}
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
        <Text className={`font-outfit text-sm ${cx.textInk}`}>{current}</Text>
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
 * @returns {JSX.Element | null}
 */
export function TransactionsTableSection({ transactions, loading, onSaveField }) {
  if (loading && transactions.length === 0) return <CircularProgress message="Loading transactions..." />;
  if (!loading && transactions.length === 0) return <EmptyState message="No transactions yet." />;
  if (transactions.length === 0) return null;

  return (
    <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-4 md:p-5`}>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: 1320 }}>
          <View className={`flex-row border-b ${cx.borderSubtle} pb-2`}>
            {[
              ["ID", 260],
              ["Kind", 120],
              ["Status", 160],
              ["Payment status", 160],
              ["Payment method", 160],
              ["Total", 110],
              ["Customer name", 180],
              ["Customer email", 220],
              ["Customer phone", 160],
              ["Notes", 220],
              ["Created", 180],
              ["Items", 260]
            ].map(([label, width]) => (
              <View key={label} style={{ width, paddingRight: 8 }}>
                <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{label}</Text>
              </View>
            ))}
          </View>

          <View className="pt-1">
            {transactions.map((tx) => (
              <View key={tx.id} className={`flex-row items-start border-b ${cx.borderSubtle} py-2`}>
                <View style={{ width: 260, paddingRight: 8 }}>
                  <Text selectable className={`font-outfit text-xs ${cx.textInk}`}>{tx.id}</Text>
                </View>
                <View style={{ width: 120, paddingRight: 8 }}>
                  <InlineSelect value={tx.kind || "buy"} options={KIND_OPTIONS} onChange={(v) => onSaveField(tx, "kind", v)} />
                </View>
                <View style={{ width: 160, paddingRight: 8 }}>
                  <InlineSelect value={tx.status || "pending"} options={STATUS_OPTIONS} onChange={(v) => onSaveField(tx, "status", v)} />
                </View>
                <View style={{ width: 160, paddingRight: 8 }}>
                  <InlineSelect value={tx.payment_status || "unpaid"} options={PAYMENT_OPTIONS} onChange={(v) => onSaveField(tx, "payment_status", v)} />
                </View>
                <View style={{ width: 160, paddingRight: 8 }}>
                  <InlineEditableCell value={tx.payment_method} placeholder="method" onSave={(v) => onSaveField(tx, "payment_method", v)} />
                </View>
                <View style={{ width: 110, paddingRight: 8, paddingTop: 6 }}>
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>₱{(Number(tx.total_cents || 0) / 100).toFixed(2)}</Text>
                </View>
                <View style={{ width: 180, paddingRight: 8 }}>
                  <InlineEditableCell value={tx.customer_name} placeholder="name" onSave={(v) => onSaveField(tx, "customer_name", v)} />
                </View>
                <View style={{ width: 220, paddingRight: 8 }}>
                  <InlineEditableCell value={tx.customer_email} placeholder="email" onSave={(v) => onSaveField(tx, "customer_email", v)} />
                </View>
                <View style={{ width: 160, paddingRight: 8 }}>
                  <InlineEditableCell value={tx.customer_phone} placeholder="phone" onSave={(v) => onSaveField(tx, "customer_phone", v)} />
                </View>
                <View style={{ width: 220, paddingRight: 8 }}>
                  <InlineEditableCell value={tx.notes} placeholder="notes" onSave={(v) => onSaveField(tx, "notes", v)} />
                </View>
                <View style={{ width: 180, paddingRight: 8, paddingTop: 6 }}>
                  <Text className={`font-outfit text-xs ${cx.textInk70}`}>{new Date(tx.created_at).toLocaleString()}</Text>
                </View>
                <View style={{ width: 260, paddingRight: 8, paddingTop: 6 }}>
                  {(tx.items || []).length ? (
                    <View className="gap-1">
                      {tx.items.map((item) => (
                        <Text key={item.id} className={`font-outfit text-xs ${cx.textInk70}`}>
                          • {item.item_name} × {item.quantity} (₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)})
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text className={`font-outfit text-xs ${cx.textInk60}`}>-</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
