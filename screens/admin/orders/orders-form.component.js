import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Button } from "../../../components/button.js";
import { FormActions } from "../../../components/form-actions.js";
import { InlineSelect } from "../../../components/inline-select.js";
import { ORDER_STATUSES } from "../../../domain/orders/constants.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../constants/theme.js";

/**
 * Admin create-order form section.
 * @module screens/admin/orders/orders-form.component
 */

export function OrdersFormSection({ form, setForm, lines, updateLine, addLine, removeLine, syncing, onCreate, expanded, onToggleExpanded }) {
  return (
    <AccordionSection title="Create order" expanded={expanded} onToggle={onToggleExpanded} className="mb-6">
      <View className="gap-3">
        <View className="gap-2">
          <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Status</Text>
          <InlineSelect value={form.status} options={ORDER_STATUSES} accessibilityLabel="Order status" onChange={(value) => setForm((f) => ({ ...f, status: value }))} />
        </View>
        <TextField label="Payment method" value={form.payment_method} onChangeText={(v) => setForm((f) => ({ ...f, payment_method: v }))} placeholder="cash, card..." />
        <TextField label="Customer name" value={form.customer_name} onChangeText={(v) => setForm((f) => ({ ...f, customer_name: v }))} placeholder="Optional" />
        <TextField label="Customer phone" value={form.customer_phone} onChangeText={(v) => setForm((f) => ({ ...f, customer_phone: v }))} placeholder="Optional" />
        <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes" multiline numberOfLines={3} />

        <Text className={`font-outfit mt-2 text-base font-bold ${cx.textInk}`}>Line items</Text>
        {lines.map((line, index) => (
          <View key={index} className={`${cx.radius.md} border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4 gap-2`}>
            <View className="flex-row items-center justify-between">
              <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Item {index + 1}</Text>
              <Button label="Remove" variant="ghost" onPress={() => removeLine(index)} disabled={syncing} />
            </View>
            <TextField label="Item name (*)" value={line.item_name} onChangeText={(v) => updateLine(index, { item_name: v })} placeholder="Item name" />
            <TextField label="Quantity (*)" value={line.quantity} onChangeText={(v) => updateLine(index, { quantity: v })} keyboardType="numeric" />
            <TextField label="Unit price (cents) (*)" value={line.unit_price_cents} onChangeText={(v) => updateLine(index, { unit_price_cents: v })} keyboardType="numeric" />
          </View>
        ))}
        <View className="flex-row flex-wrap gap-3">
          <Button label="Add item" variant="ghost" onPress={addLine} disabled={syncing} />
        </View>
        <FormActions onSave={onCreate} saveLabel="Create order" saving={syncing} />
      </View>
    </AccordionSection>
  );
}
