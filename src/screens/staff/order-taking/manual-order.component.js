import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "../../../components/button.js";
import { FormActions } from "../../../components/form-actions.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { QrScanner } from "../../../components/qr-scanner.js";
import { StatusPill } from "../../../components/status-pill.js";
import { TextField } from "../../../components/text-field.js";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../../../domain/orders/constants.js";
import { MENU_SORT_RANGES } from "../../../domain/menu/sections.js";
import { calculateOrderTotals } from "../../../domain/orders/pricing.js";
import { formatCurrencyCents } from "../../../shared/format/currency.js";
import { pickQrImage } from "../../../shared/utils/qr-upload.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Staff order-taking form with optional order reference lookup.
 * @module screens/staff/order-taking/manual-order.component
 */

/**
 * @param {object} props
 * @param {object[]} props.items - Available menu items.
 * @param {string} props.reference - QR payload or order number input.
 * @param {(value: string) => void} props.onReferenceChange - Reference input handler.
 * @param {() => void} props.onLookup - Fills the form from the reference.
 * @param {(value: string) => void} props.onScan - QR scan handler.
 * @param {object | null} props.matchedOrder - Order loaded from the reference.
 * @param {object} props.form - Order-level fields.
 * @param {(updater: (form: object) => object) => void} props.setForm - Form updater.
 * @param {object[]} props.lines - Selected menu lines.
 * @param {(index: number, name: string) => void} props.onSelectItem - Selects a menu item for a line.
 * @param {(index: number, patch: object) => void} props.updateLine - Updates a line field.
 * @param {() => void} props.addLine - Adds a line.
 * @param {(index: number) => void} props.removeLine - Removes a line.
 * @param {boolean} props.saving - Whether the order is being saved.
 * @param {() => void} props.onSave - Verifies or creates the order.
 * @param {() => void} props.onClear - Resets the form.
 * @param {string} props.saveLabel - Primary action label.
 * @returns {JSX.Element}
 */
export function ManualOrderForm({
  items,
  reference,
  onReferenceChange,
  onLookup,
  onScan,
  matchedOrder,
  form,
  setForm,
  lines,
  onSelectItem,
  updateLine,
  addLine,
  removeLine,
  saving,
  onSave,
  onClear,
  saveLabel
}) {
  const [uploadError, setUploadError] = useState("");
  const itemNames = items.map((item) => item.name);
  const totals = calculateOrderTotals(lines);

  const onUpload = async () => {
    setUploadError("");
    try {
      const value = await pickQrImage();
      if (!value) {
        setUploadError("No QR code found in that image.");
        return;
      }
      onScan(value);
    } catch {
      setUploadError("Could not read that image.");
    }
  };

  return (
    <View className="gap-3">
      <View className={`${cx.radius.md} border ${cx.borderSubtle} ${cx.bgSurfaceSoft} gap-3 p-4`}>
        <View>
          <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Order reference (optional)</Text>
          <Text className={`font-outfit mt-1 text-xs ${cx.textInk70}`}>
            Paste a QR payload or order number to fill items, customer, notes, and prices automatically.
          </Text>
        </View>
        <TextField
          label="QR payload or order number"
          value={reference}
          onChangeText={onReferenceChange}
          placeholder="ORD-XXXXXXXXXX or pasted QR payload"
          autoCapitalize="characters"
        />
        <QrScanner onDetect={onScan} />
        <View className="flex-row flex-wrap gap-3">
          <Button
            label="Fill from order"
            variant="secondary"
            onPress={onLookup}
            loading={saving}
            disabled={!reference.trim() || saving}
          />
          <Button label="Upload QR image" variant="ghost" onPress={onUpload} disabled={saving} />
        </View>
        {uploadError ? <Text className={`font-outfit text-xs ${cx.textError}`}>{uploadError}</Text> : null}
        {matchedOrder ? (
          <View className="flex-row flex-wrap items-center gap-2">
            <StatusPill label={matchedOrder.status} variant="info" />
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>{matchedOrder.order_number} loaded</Text>
          </View>
        ) : null}
      </View>

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

      <FormActions onSave={onSave} onClear={onClear} saveLabel={saveLabel} clearLabel="Clear" saving={saving} />
    </View>
  );
}
