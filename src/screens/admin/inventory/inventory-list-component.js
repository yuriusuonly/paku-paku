import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
// (Button removed - no +/- controls in table)
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Inventory records table section.
 * @module screens/admin/inventory/inventory-list-component
 */

const columns = [
  { key: "name", label: "Name", width: 180 },
  { key: "sku", label: "SKU", width: 120 },
  { key: "quantity", label: "Qty", width: 140 },
  { key: "unit", label: "Unit", width: 90 },
  { key: "reorder_level", label: "Reorder", width: 90 },
  { key: "unit_cost_cents", label: "Unit cost", width: 110 },
  { key: "value", label: "Value", width: 110 },
  { key: "menu_item_id", label: "Menu item ID", width: 220 },
  { key: "is_active", label: "Status", width: 120 },
  { key: "id", label: "ID", width: 260 }
];

function InlineEditableCell({ value, onSave, numeric = false, placeholder = "" }) {
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
      keyboardType={numeric ? "numeric" : "default"}
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm ${cx.textInk}`}
    />
  );
}

export function InventoryListSection({ items, loading, syncing, savingCell, onSaveField, onToggleActive }) {
  const showInitialLoading = loading && items.length === 0;

  return (
    <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-4 md:p-5`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Inventory records</Text>
        {syncing ? <CircularProgress size="small" /> : null}
      </View>

      {showInitialLoading ? (
        <CircularProgress message="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState message="No inventory items yet. Add your first stock record above." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator className={`${syncing ? "opacity-80" : "opacity-100"}`}>
          <View style={{ minWidth: 1340 }}>
            <View className={`flex-row border-b ${cx.borderSubtle} pb-2`}>
              {columns.map((column) => (
                <View key={column.key} style={{ width: column.width, paddingRight: 8 }}>
                  <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{column.label}</Text>
                </View>
              ))}
            </View>

            <View className="pt-1">
              {items.map((item) => {
                const valueCents = Number(item.quantity || 0) * Number(item.unit_cost_cents || 0);
                const busy = savingCell?.startsWith(`${item.id}:`);
                return (
                  <View key={item.id} className={`flex-row items-start border-b ${cx.borderSubtle} py-2`}>
                    <View style={{ width: columns[0].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.name} placeholder="name" onSave={(v) => onSaveField(item, "name", v)} />
                    </View>
                    <View style={{ width: columns[1].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.sku} placeholder="sku" onSave={(v) => onSaveField(item, "sku", v)} />
                    </View>
                    <View style={{ width: columns[2].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.quantity} numeric placeholder="0" onSave={(v) => onSaveField(item, "quantity", v)} />
                    </View>
                    <View style={{ width: columns[3].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.unit} placeholder="unit" onSave={(v) => onSaveField(item, "unit", v)} />
                    </View>
                    <View style={{ width: columns[4].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.reorder_level} numeric placeholder="0" onSave={(v) => onSaveField(item, "reorder_level", v)} />
                    </View>
                    <View style={{ width: columns[5].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.unit_cost_cents} numeric placeholder="0" onSave={(v) => onSaveField(item, "unit_cost_cents", v)} />
                    </View>
                    <View style={{ width: columns[6].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk70}`}>₱{(valueCents / 100).toFixed(2)}</Text>
                    </View>
                    <View style={{ width: columns[7].width, paddingRight: 8 }}>
                      <InlineEditableCell value={item.menu_item_id || ""} placeholder="N/A" onSave={(v) => onSaveField(item, "menu_item_id", v)} />
                    </View>
                    <View style={{ width: columns[8].width, paddingRight: 8, paddingTop: 4 }}>
                      <Pressable
                        onPress={() => { void onToggleActive(item); }}
                        disabled={busy}
                        className={`self-start rounded-full px-3 py-1 ${item.is_active ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                      >
                        <Text className={`font-outfit text-xs font-semibold uppercase ${item.is_active ? cx.textPrimary : cx.textInk70}`}>
                          {item.is_active ? "In Stock" : "Out of Stock"}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={{ width: columns[9].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text selectable className={`font-outfit text-xs ${cx.textInk}`}>{item.id}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
