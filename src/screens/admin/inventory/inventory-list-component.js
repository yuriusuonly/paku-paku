import { Text } from "react-native";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { StatusPill } from "../../../components/status-pill.js";
import { DataTable } from "../../../components/table.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { INVENTORY_STATUS } from "../../../shared/constants/domain.js";
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

const editableKeys = new Set(["name", "sku", "quantity", "unit", "reorder_level", "unit_cost_cents", "menu_item_id"]);
const numericKeys = new Set(["quantity", "reorder_level", "unit_cost_cents"]);

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function InventoryListSection({
  items,
  loading,
  syncing,
  savingCell,
  onSaveField,
  onToggleActive
}) {
  return (
    <DataTable
      columns={columns}
      rows={items}
      loading={loading && items.length === 0}
      syncing={syncing}
      loadingMessage="Loading inventory..."
      emptyMessage="No inventory items yet. Add your first stock record above."
      renderCell={(item, column) => {
        const key = column.key;

        if (editableKeys.has(key)) {
          return (
            <InlineEditableCell
              value={item[key] ?? ""}
              numeric={numericKeys.has(key)}
              placeholder={key === "menu_item_id" ? "N/A" : key}
              onSave={(value) => onSaveField(item, key, value)}
              saving={savingCell === `${item.id}:${key}`}
            />
          );
        }

        if (key === "value") {
          const valueCents = Number(item.quantity || 0) * Number(item.unit_cost_cents || 0);
          return <Text className={`font-outfit text-sm ${cx.textInk70}`}>{formatCurrencyCents(valueCents)}</Text>;
        }

        if (key === "is_active") {
          return (
            <StatusPill
              label={item.is_active ? INVENTORY_STATUS.active : INVENTORY_STATUS.inactive}
              variant={item.is_active ? "success" : "neutral"}
              onPress={() => { void onToggleActive(item); }}
              disabled={savingCell?.startsWith(`${item.id}:`)}
            />
          );
        }

        return (
          <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>
            {String(item.id ?? "-")}
          </Text>
        );
      }}
    />
  );
}
