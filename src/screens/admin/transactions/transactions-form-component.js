import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Button } from "../../../components/button.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin create-transaction form section.
 * @module screens/admin/transactions/transactions-form-component
 */

const KIND_OPTIONS = ["buy", "sell"];

export function TransactionsFormSection({ form, setForm, lines, updateLine, addLine, removeLine, syncing, onCreate, expanded, onToggleExpanded }) {
  return (
    <AccordionSection title="Create transaction" expanded={expanded} onToggle={onToggleExpanded} className="mb-6">
      <View className="gap-3">
        <View className="flex-row flex-wrap gap-2">
          {KIND_OPTIONS.map((v) => (
            <Button key={v} label={v} variant={form.kind === v ? "secondary" : "ghost"} onPress={() => setForm((f) => ({ ...f, kind: v }))} />
          ))}
        </View>
        <TextField label="Status" value={form.status} onChangeText={(v) => setForm((f) => ({ ...f, status: v }))} placeholder="pending, confirmed, preparing, completed, cancelled" />
        <TextField label="Payment status" value={form.payment_status} onChangeText={(v) => setForm((f) => ({ ...f, payment_status: v }))} placeholder="unpaid, paid, refunded, partial" />
        <TextField label="Payment method" value={form.payment_method} onChangeText={(v) => setForm((f) => ({ ...f, payment_method: v }))} placeholder="cash, card, gcash..." />
        <TextField label="Customer name" value={form.customer_name} onChangeText={(v) => setForm((f) => ({ ...f, customer_name: v }))} placeholder="Optional" />
        <TextField label="Customer phone" value={form.customer_phone} onChangeText={(v) => setForm((f) => ({ ...f, customer_phone: v }))} placeholder="Optional" />
        <TextField label="Notes" value={form.notes} onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes" multiline numberOfLines={3} />

        <Text className={`font-outfit mt-2 text-base font-bold ${cx.textInk}`}>Line items</Text>
        {lines.map((line, index) => (
          <View key={index} className={`rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4 gap-2`}>
            <View className="flex-row items-center justify-between">
              <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Item {index + 1}</Text>
              <Button label="Remove" variant="ghost" onPress={() => removeLine(index)} disabled={syncing} />
            </View>
            <TextField label="Item name (*)" value={line.item_name} onChangeText={(v) => updateLine(index, { item_name: v })} placeholder="Item name" />
            <TextField label="Quantity (*)" value={line.quantity} onChangeText={(v) => updateLine(index, { quantity: v })} keyboardType="numeric" />
            <TextField label="Unit price (cents) (*)" value={line.unit_price_cents} onChangeText={(v) => updateLine(index, { unit_price_cents: v })} keyboardType="numeric" />
            <TextField label="Menu item ID" value={line.menu_item_id} onChangeText={(v) => updateLine(index, { menu_item_id: v })} placeholder="Optional" />
            <TextField label="Inventory item ID" value={line.inventory_item_id} onChangeText={(v) => updateLine(index, { inventory_item_id: v })} placeholder="Optional (decrements on completed sell)" />
          </View>
        ))}
        <View className="flex-row flex-wrap gap-3">
          <Button label="Add item" variant="ghost" onPress={addLine} disabled={syncing} />
          <Button label="Create transaction" onPress={onCreate} loading={syncing} />
        </View>
      </View>
    </AccordionSection>
  );
}
