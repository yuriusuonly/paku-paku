import { ScrollView, Text, View } from "react-native";
import { Button } from "../../../components/button.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Inventory records list section.
 * @module screens/admin/inventory/inventory-list-component
 */

export function InventoryListSection({ items, loading, syncing, busyId, onAdjust, onEdit, onRemove }) {
  const showInitialLoading = loading && items.length === 0;
  return (
    <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Inventory records</Text>
        {syncing ? <Text className={`font-outfit text-xs ${cx.textInk60}`}>Syncing...</Text> : null}
      </View>

      {showInitialLoading ? (
        <CircularProgress message="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState message="No inventory items yet. Add your first stock record above." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View className="min-w-full gap-3">
            {items.map((item) => {
              const low = item.is_active && Number(item.quantity || 0) <= Number(item.reorder_level || 0);
              return (
                <View key={item.id} className={`rounded-2xl border ${low ? cx.borderPrimary30 : cx.borderSubtle} ${cx.bgSurfaceSoft} p-4`}>
                  <View className="flex-row flex-wrap items-start justify-between gap-3">
                    <View className="flex-1 min-w-[220px]">
                      <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>{item.name}</Text>
                      <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                        SKU: {item.sku || "-"} · Unit: {item.unit || "-"} · Qty: {item.quantity} · Reorder: {item.reorder_level}
                      </Text>
                      <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                        Unit cost: ₱{(Number(item.unit_cost_cents || 0) / 100).toFixed(2)} · Value: ₱{((Number(item.quantity || 0) * Number(item.unit_cost_cents || 0)) / 100).toFixed(2)}
                      </Text>
                      <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>
                        Menu item: {item.menu_item_id || "-"} · {item.is_active ? "Active" : "Inactive"}{low ? " · Low stock" : ""}
                      </Text>
                      {item.description ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{item.description}</Text> : null}
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                      <Button label="-1" variant="ghost" onPress={() => onAdjust(item, -1)} loading={busyId === item.id} disabled={busyId === item.id} />
                      <Button label="+1" variant="ghost" onPress={() => onAdjust(item, 1)} loading={busyId === item.id} disabled={busyId === item.id} />
                      <Button label="Edit" variant="secondary" onPress={() => onEdit(item)} disabled={busyId === item.id} />
                      <Button label="Delete" variant="ghost" onPress={() => onRemove(item)} loading={busyId === item.id} disabled={busyId === item.id} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
