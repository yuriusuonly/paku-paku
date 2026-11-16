import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "../../../components/button.js";
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
  { key: "quantity", label: "Qty", width: 80 },
  { key: "unit", label: "Unit", width: 90 },
  { key: "reorder_level", label: "Reorder", width: 90 },
  { key: "unit_cost_cents", label: "Unit cost", width: 110 },
  { key: "value", label: "Value", width: 110 },
  { key: "menu_item_id", label: "Menu item ID", width: 220 },
  { key: "is_active", label: "Status", width: 110 },
  { key: "id", label: "ID", width: 260 },
  { key: "actions", label: "Actions", width: 240 }
];

export function InventoryListSection({ items, loading, syncing, busyId, onAdjust, onEdit, onRemove }) {
  const showInitialLoading = loading && items.length === 0;

  return (
    <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-4 md:p-5`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Inventory records</Text>
        {syncing ? <Text className={`font-outfit text-xs ${cx.textInk60}`}>Syncing...</Text> : null}
      </View>

      {showInitialLoading ? (
        <CircularProgress message="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState message="No inventory items yet. Add your first stock record above." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ minWidth: 1610 }}>
            <View className={`flex-row border-b ${cx.borderSubtle} pb-2`}>
              {columns.map((column) => (
                <View key={column.key} style={{ width: column.width, paddingRight: 8 }}>
                  <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{column.label}</Text>
                </View>
              ))}
            </View>

            <View className="pt-1">
              {items.map((item) => {
                const low = item.is_active && Number(item.quantity || 0) <= Number(item.reorder_level || 0);
                const valueCents = Number(item.quantity || 0) * Number(item.unit_cost_cents || 0);
                const busy = busyId === item.id;
                return (
                  <View key={item.id} className={`flex-row items-start border-b ${cx.borderSubtle} py-2`}>
                    <View style={{ width: columns[0].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>{item.name || "-"}</Text>
                      {item.description ? <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`} numberOfLines={2}>{item.description}</Text> : null}
                    </View>
                    <View style={{ width: columns[1].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>{item.sku || "-"}</Text>
                    </View>
                    <View style={{ width: columns[2].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${low ? `font-semibold ${cx.textPrimary}` : cx.textInk}`}>{item.quantity ?? 0}</Text>
                    </View>
                    <View style={{ width: columns[3].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk70}`}>{item.unit || "-"}</Text>
                    </View>
                    <View style={{ width: columns[4].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk70}`}>{item.reorder_level ?? 0}</Text>
                    </View>
                    <View style={{ width: columns[5].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk70}`}>₱{(Number(item.unit_cost_cents || 0) / 100).toFixed(2)}</Text>
                    </View>
                    <View style={{ width: columns[6].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text className={`font-outfit text-sm ${cx.textInk70}`}>₱{(valueCents / 100).toFixed(2)}</Text>
                    </View>
                    <View style={{ width: columns[7].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text selectable className={`font-outfit text-xs ${cx.textInk70}`}>{item.menu_item_id || "-"}</Text>
                    </View>
                    <View style={{ width: columns[8].width, paddingRight: 8, paddingTop: 4 }}>
                      <View className={`self-start rounded-full px-3 py-1 ${item.is_active ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}>
                        <Text className={`font-outfit text-xs font-semibold uppercase ${item.is_active ? cx.textPrimary : cx.textInk70}`}>
                          {item.is_active ? (low ? "Low stock" : "Active") : "Inactive"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: columns[9].width, paddingRight: 8, paddingTop: 6 }}>
                      <Text selectable className={`font-outfit text-xs ${cx.textInk}`}>{item.id}</Text>
                    </View>
                    <View style={{ width: columns[10].width, paddingRight: 8 }}>
                      <View className="flex-row flex-wrap gap-2">
                        <Button label="-1" variant="ghost" onPress={() => onAdjust(item, -1)} loading={busy} disabled={busy} />
                        <Button label="+1" variant="ghost" onPress={() => onAdjust(item, 1)} loading={busy} disabled={busy} />
                        <Button label="Edit" variant="secondary" onPress={() => onEdit(item)} disabled={busy} />
                        <Button label="Delete" variant="ghost" onPress={() => onRemove(item)} disabled={busy} />
                      </View>
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
