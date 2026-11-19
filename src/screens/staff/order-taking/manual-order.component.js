import { Text, View } from "react-native";
import { Button } from "../../../components/button.js";
import { FormActions } from "../../../components/form-actions.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { TextField } from "../../../components/text-field.js";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../../../domain/orders/constants.js";
import { MENU_SORT_RANGES } from "../../../domain/menu/sections.js";
import { calculateOrderTotals } from "../../../domain/orders/pricing.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Manual staff order-taking form.
 * @module screens/staff/order-taking/manual-order.component
 */

/**
 * @param {object} props
 * @param {object[]} props.items - Available menu items.
 * @param {object} props.form - Order-level fields.
 * @param {(updater: (form: object) => object) => void} props.setForm - Form updater.
 * @param {object[]} props.lines - Selected menu lines.
 * @param {(index: number, name: string) => void} props.onSelectItem - Selects a menu item for a line.
 * @param {(index: number, patch: object) => void} props.updateLine - Updates a line field.
 * @param {() => void} props.addLine - Adds a line.
 * @param {(index: number) => void} props.removeLine - Removes a line.
 * @param {boolean} props.saving - Whether the order is being saved.
 * @param {() => void} props.onCreate - Creates the order.
 * @param {() => void} props.onClear - Resets the form.
 * @returns {JSX.Element}
 */
export function ManualOrderForm({
  items,
  form,
  setForm,
  lines,
  onSelectItem,
  updateLine,
  addLine,
  removeLine,
  saving,
  onCreate,
  onClear
}) {
  const itemNames = items.map((item) => item.name);
  const totals = calculateOrderTotals(lines);

  return (
    <View className="gap-3">
      <Text className={`font-outfit text-sm ${cx.textInk70}`}>
        Select menu items, set quantities, and record the payment. Meal pairs receive the automatic discount.
      </Text>

      <View className="flex-row flex-wrap items-center gap-3">
        <View className="gap-1">
          <Text className={`font-outfit text-xs font-semibold ${cx.textInk70}`}>Status</Text>
          <InlineSelect
            value={form.status}
            options={ORDER_STATUSES}
            accessibilityLabel="Order status"
            disabled={saving}
            onChange={(value) => setForm((current) => ({ ...current, status: value }))}
          />
        </View>
        <View className="gap-1">
          <Text className={`font-outfit text-xs font-semibold ${cx.textInk70}`}>Payment method</Text>
          <InlineSelect
            value={form.payment_method}
            options={PAYMENT_METHODS}
            accessibilityLabel="Payment method"
            disabled={saving}
            onChange={(value) => setForm((current) => ({ ...current, payment_method: value }))}
          />
        </View>
      </View>

      <TextField
        label="Customer name"
        value={form.customer_name}
        onChangeText={(value) => setForm((current) => ({ ...current, customer_name: value }))}
        placeholder="Optional (walk-in)"
      />
      <TextField
        label="Notes"
        value={form.notes}
        onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))}
        placeholder="Optional notes"
        multiline
        numberOfLines={3}
      />

      <Text className={`font-outfit mt-2 text-base font-bold ${cx.textInk}`}>Items</Text>
      {itemNames.length === 0 ? (
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>The menu is not available yet.</Text>
      ) : null}

      {lines.map((line, index) => (
        <View key={index} className={`${cx.radius.md} border ${cx.borderSubtle} ${cx.bgSurfaceSoft} gap-2 p-4`}>
          <View className="flex-row items-center justify-between">
            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Item {index + 1}</Text>
            <Button label="Remove" variant="ghost" onPress={() => removeLine(index)} disabled={saving} />
          </View>
          <InlineSelect
            value={line.item_name}
            options={itemNames}
            accessibilityLabel={`Item ${index + 1}`}
            disabled={saving}
            onChange={(value) => onSelectItem(index, value)}
          />
          <TextField
            label="Quantity"
            value={line.quantity}
            onChangeText={(value) => updateLine(index, { quantity: value })}
            keyboardType="numeric"
          />
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>
            {formatCurrencyCents(Number(line.unit_price_cents || 0))} each
          </Text>
        </View>
      ))}

      <Button label="Add item" variant="ghost" onPress={addLine} disabled={saving || itemNames.length === 0} />

      <View className={`${cx.radius.md} ${cx.bgSurfaceSoft} gap-1 p-4`}>
        <View className="flex-row items-center justify-between">
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Subtotal</Text>
          <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>{formatCurrencyCents(totals.subtotalCents)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Meal discount</Text>
          <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>-{formatCurrencyCents(totals.discountCents)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>Total</Text>
          <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>{formatCurrencyCents(totals.totalCents)}</Text>
        </View>
      </View>

      <FormActions onSave={onCreate} onClear={onClear} saveLabel="Create order" clearLabel="Clear" saving={saving} />
    </View>
  );
}
