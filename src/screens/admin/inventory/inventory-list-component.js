import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
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
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm font-bold ${cx.textInk}`}
    />
  );
}

export function InventoryListSection({ items, loading, syncing, savingCell, onSaveField, onToggleActive }) {
  const showInitialLoading = loading && items.length === 0;

  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading inventory..." /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState message="No inventory items yet. Add your first stock record above." />
      ) : null}

      {items.length > 0 ? (
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

            {items.map((item, rowIndex) => {
              const rowKey = String(item.id ?? `row-${rowIndex}`);
              const valueCents = Number(item.quantity || 0) * Number(item.unit_cost_cents || 0);
              const busy = savingCell?.startsWith(`${item.id}:`);
              return (
                <View
                  key={rowKey}
                  className={`flex-row ${rowIndex < items.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                >
                  {columns.map((column, index) => {
                    const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                    return (
                      <View
                        key={`${rowKey}-${column.key}`}
                        style={{ width: column.width }}
                        className={`justify-center px-4 py-3 ${cellBorder}`}
                      >
                        {column.key === "name" ? (
                          <InlineEditableCell value={item.name} placeholder="name" onSave={(v) => onSaveField(item, "name", v)} />
                        ) : column.key === "sku" ? (
                          <InlineEditableCell value={item.sku} placeholder="sku" onSave={(v) => onSaveField(item, "sku", v)} />
                        ) : column.key === "quantity" ? (
                          <InlineEditableCell value={item.quantity} numeric placeholder="0" onSave={(v) => onSaveField(item, "quantity", v)} />
                        ) : column.key === "unit" ? (
                          <InlineEditableCell value={item.unit} placeholder="unit" onSave={(v) => onSaveField(item, "unit", v)} />
                        ) : column.key === "reorder_level" ? (
                          <InlineEditableCell value={item.reorder_level} numeric placeholder="0" onSave={(v) => onSaveField(item, "reorder_level", v)} />
                        ) : column.key === "unit_cost_cents" ? (
                          <InlineEditableCell value={item.unit_cost_cents} numeric placeholder="0" onSave={(v) => onSaveField(item, "unit_cost_cents", v)} />
                        ) : column.key === "value" ? (
                          <Text className={`font-outfit text-sm ${cx.textInk70}`}>₱{(valueCents / 100).toFixed(2)}</Text>
                        ) : column.key === "menu_item_id" ? (
                          <InlineEditableCell value={item.menu_item_id || ""} placeholder="N/A" onSave={(v) => onSaveField(item, "menu_item_id", v)} />
                        ) : column.key === "is_active" ? (
                          <Pressable
                            onPress={() => { void onToggleActive(item); }}
                            disabled={busy}
                            className={`self-start rounded-full px-3 py-1 ${item.is_active ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                          >
                            <Text className={`font-outfit text-xs font-bold uppercase ${item.is_active ? cx.textPrimary : cx.textInk70}`}>
                              {item.is_active ? "In Stock" : "Out of Stock"}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>{String(item.id ?? "-")}</Text>
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
