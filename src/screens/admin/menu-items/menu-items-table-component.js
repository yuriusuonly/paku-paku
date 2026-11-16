import { Text } from "react-native";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { StatusPill } from "../../../components/status-pill.js";
import { DataTable } from "../../../components/table.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Menu items table section.
 * @module screens/admin/menu-items/menu-items-table-component
 */

const columns = [
  { key: "name", label: "Name", width: 180 },
  { key: "price_cents", label: "Price (cents)", width: 140 },
  { key: "sort_order", label: "Sort", width: 90 },
  { key: "is_available", label: "Available", width: 130 },
  { key: "is_best_seller", label: "Best seller", width: 140 },
  { key: "description", label: "Description", width: 320 },
  { key: "id", label: "Item ID", width: 320 },
  { key: "created_at", label: "Created at", width: 220 },
  { key: "updated_at", label: "Updated at", width: 220 }
];

const editableKeys = new Set(["name", "description", "price_cents", "sort_order"]);

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function MenuItemsTableSection({
  items,
  sorted,
  loading,
  syncing,
  error,
  savingCell,
  onSaveField,
  onToggleAvailable,
  onToggleBestSeller
}) {
  return (
    <DataTable
      columns={columns}
      rows={sorted}
      loading={loading && items.length === 0}
      syncing={syncing}
      error={error}
      loadingMessage="Loading menu items..."
      emptyMessage="No menu items yet. Create one above to get started."
      renderCell={(item, column) => {
        const rawValue = item[column.key];
        const key = column.key;

        if (key === "is_available") {
          return (
            <StatusPill
              label={rawValue ? "available" : "unavailable"}
              variant={rawValue ? "success" : "neutral"}
              onPress={() => { void onToggleAvailable(item); }}
              disabled={savingCell === `${item.id}:is_available`}
            />
          );
        }

        if (key === "is_best_seller") {
          return (
            <StatusPill
              label={rawValue ? "best seller" : "regular"}
              variant={rawValue ? "success" : "neutral"}
              onPress={() => { void onToggleBestSeller(item); }}
              disabled={savingCell === `${item.id}:is_best_seller`}
            />
          );
        }

        if (editableKeys.has(key)) {
          return (
            <InlineEditableCell
              value={rawValue ?? ""}
              onSave={(draft) => onSaveField(item, key, draft)}
              numeric={key === "price_cents" || key === "sort_order"}
              multiline={key === "description"}
              placeholder={key === "description" ? "Add description" : ""}
              saving={savingCell === `${item.id}:${key}`}
            />
          );
        }

        const displayValue = key === "created_at" || key === "updated_at"
          ? formatAuditTimestamp(rawValue)
          : String(rawValue ?? "-");

        return (
          <Text
            selectable
            className={`font-outfit text-sm ${key === "name" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}
          >
            {displayValue}
          </Text>
        );
      }}
    />
  );
}
