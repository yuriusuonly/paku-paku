import { Text } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { StatusPill } from "../../../components/status-pill.js";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableScroll } from "../../../components/table.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
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

export function InventoryListSection({ items, loading, syncing, savingCell, onSaveField, onToggleActive }) {
  const showInitialLoading = loading && items.length === 0;

  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading inventory..." /> : null}

      {!loading && items.length === 0 ? (
        <EmptyState message="No inventory items yet. Add your first stock record above." />
      ) : null}

      {items.length > 0 ? (
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
              {items.map((item, rowIndex) => {
                const rowKey = String(item.id ?? `row-${rowIndex}`);
                const valueCents = Number(item.quantity || 0) * Number(item.unit_cost_cents || 0);
                const busy = savingCell?.startsWith(`${item.id}:`);
                return (
                  <TableRow key={rowKey} last={rowIndex === items.length - 1}>
                    {columns.map((column, index) => {
                      const last = index === columns.length - 1;
                      return (
                        <TableCell key={`${rowKey}-${column.key}`} width={column.width} last={last}>
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
                            <Text className={`font-outfit text-sm ${cx.textInk70}`}>{formatCurrencyCents(valueCents)}</Text>
                          ) : column.key === "menu_item_id" ? (
                            <InlineEditableCell value={item.menu_item_id || ""} placeholder="N/A" onSave={(v) => onSaveField(item, "menu_item_id", v)} />
                          ) : column.key === "is_active" ? (
                            <StatusPill
                              label={item.is_active ? "In Stock" : "Out of Stock"}
                              active={Boolean(item.is_active)}
                              onPress={() => { void onToggleActive(item); }}
                              disabled={busy}
                            />
                          ) : (
                            <Text selectable className={`font-outfit text-sm ${cx.textInk70}`}>{String(item.id ?? "-")}</Text>
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
