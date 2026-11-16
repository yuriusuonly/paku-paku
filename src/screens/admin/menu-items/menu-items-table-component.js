import { Pressable, Text } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { InlineEditableCell } from "../../../components/inline-editable-cell.js";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableScroll } from "../../../components/table.js";
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

function formatAuditTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

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
  const showInitialLoading = loading && items.length === 0;

  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading menu items..." /> : null}

      {!loading && !error && sorted.length === 0 ? (
        <EmptyState message="No menu items yet. Create one above to get started." />
      ) : null}

      {sorted.length > 0 ? (
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
              {sorted.map((item, rowIndex) => {
                const rowKey = String(item.id ?? `row-${rowIndex}`);
                return (
                  <TableRow key={rowKey} last={rowIndex === sorted.length - 1}>
                    {columns.map((column, index) => {
                      const rawValue = item[column.key];
                      const displayValue =
                        column.key === "created_at" || column.key === "updated_at"
                          ? formatAuditTimestamp(rawValue)
                          : (rawValue ?? "-");
                      const last = index === columns.length - 1;
                      const isEditable = ["name", "description", "price_cents", "sort_order"].includes(column.key);
                      const isAvailability = column.key === "is_available";
                      const isBestSeller = column.key === "is_best_seller";

                      return (
                        <TableCell key={`${rowKey}-${column.key}`} width={column.width} last={last}>
                          {isAvailability ? (
                            <Pressable
                              onPress={() => { void onToggleAvailable(item); }}
                              disabled={savingCell === `${item.id}:is_available`}
                              className={`self-start rounded-full px-3 py-1 ${rawValue ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                            >
                              <Text className={`font-outfit text-xs font-bold uppercase ${rawValue ? cx.textPrimary : cx.textInk70}`}>
                                {rawValue ? "available" : "unavailable"}
                              </Text>
                            </Pressable>
                          ) : isBestSeller ? (
                            <Pressable
                              onPress={() => { void onToggleBestSeller(item); }}
                              disabled={savingCell === `${item.id}:is_best_seller`}
                              className={`self-start rounded-full px-3 py-1 ${rawValue ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                            >
                              <Text className={`font-outfit text-xs font-bold uppercase ${rawValue ? cx.textPrimary : cx.textInk70}`}>
                                {rawValue ? "best seller" : "regular"}
                              </Text>
                            </Pressable>
                          ) : isEditable ? (
                            <InlineEditableCell
                              value={rawValue ?? (column.key === "description" ? "" : rawValue)}
                              onSave={(draft) => onSaveField(item, column.key, draft)}
                              numeric={column.key === "price_cents" || column.key === "sort_order"}
                              multiline={column.key === "description"}
                              placeholder={column.key === "description" ? "Add description" : ""}
                            />
                          ) : (
                            <Text
                              selectable
                              className={`font-outfit text-sm ${column.key === "name" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}
                            >
                              {String(displayValue)}
                            </Text>
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
