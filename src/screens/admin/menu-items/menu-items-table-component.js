import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
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

function InlineEditableCell({ value, onSave, numeric = false, placeholder = "", multiline = false }) {
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

  const handleKeyPress = (event) => {
    if (!multiline) return;
    const key = event?.nativeEvent?.key;
    const shiftKey = event?.nativeEvent?.shiftKey;
    if (key === "Enter" && !shiftKey) {
      event.preventDefault?.();
      void commit();
    }
  };

  return (
    <TextInput
      value={draft}
      onChangeText={setDraft}
      onFocus={() => setFocused(true)}
      onBlur={() => { void commit(); }}
      onSubmitEditing={multiline ? undefined : () => { void commit(); }}
      onKeyPress={handleKeyPress}
      blurOnSubmit={!multiline}
      placeholder={placeholder}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm font-semibold ${cx.textInk} ${multiline ? "min-h-[72px]" : ""}`}
    />
  );
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

            {sorted.map((item, rowIndex) => {
              const rowKey = String(item.id ?? `row-${rowIndex}`);
              return (
                <View
                  key={rowKey}
                  className={`flex-row ${rowIndex < sorted.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                >
                  {columns.map((column, index) => {
                    const rawValue = item[column.key];
                    const displayValue =
                      column.key === "created_at" || column.key === "updated_at"
                        ? formatAuditTimestamp(rawValue)
                        : (rawValue ?? "-");
                    const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                    const isEditable = ["name", "description", "price_cents", "sort_order"].includes(column.key);
                    const isAvailability = column.key === "is_available";
                    const isBestSeller = column.key === "is_best_seller";

                    return (
                      <View
                        key={`${rowKey}-${column.key}`}
                        style={{ width: column.width }}
                        className={`justify-center px-4 py-3 ${cellBorder}`}
                      >
                        {isAvailability ? (
                          <Pressable
                            onPress={() => { void onToggleAvailable(item); }}
                            disabled={savingCell === `${item.id}:is_available`}
                            className={`self-start rounded-full px-3 py-1 ${rawValue ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                          >
                            {savingCell === `${item.id}:is_available` ? (
                              <CircularProgress size="small" />
                            ) : (
                              <Text
                                className={`font-outfit text-xs font-semibold uppercase ${rawValue ? cx.textPrimary : cx.textInk70}`}
                              >
                                {rawValue ? "available" : "unavailable"}
                              </Text>
                            )}
                          </Pressable>
                        ) : isBestSeller ? (
                          <Pressable
                            onPress={() => { void onToggleBestSeller(item); }}
                            disabled={savingCell === `${item.id}:is_best_seller`}
                            className={`self-start rounded-full px-3 py-1 ${rawValue ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                          >
                            {savingCell === `${item.id}:is_best_seller` ? (
                              <CircularProgress size="small" />
                            ) : (
                              <Text
                                className={`font-outfit text-xs font-semibold uppercase ${rawValue ? cx.textPrimary : cx.textInk70}`}
                              >
                                {rawValue ? "best seller" : "regular"}
                              </Text>
                            )}
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
