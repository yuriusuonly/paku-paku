import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Button } from "../../../components/button.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Inventory create form section (accordion).
 * @module screens/admin/inventory/inventory-form-component
 */

export function InventoryFormSection({ form, setForm, saving, syncing, menuItems, onSave, onReset, expanded, onToggleExpanded }) {
  return (
    <AccordionSection title="Add inventory item" expanded={expanded} onToggle={onToggleExpanded} className="mb-6">
      <View className="gap-3">
        <TextField label="Name (*)" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Chicken breast" />
        <TextField label="SKU" value={form.sku} onChangeText={(v) => setForm((f) => ({ ...f, sku: v }))} placeholder="Optional SKU" />
        <TextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Optional description" multiline numberOfLines={3} />
        <TextField label="Quantity (*)" value={form.quantity} onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))} placeholder="0" keyboardType="numeric" />
        <TextField label="Unit" value={form.unit} onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))} placeholder="e.g. pcs, kg" />
        <TextField label="Reorder level" value={form.reorder_level} onChangeText={(v) => setForm((f) => ({ ...f, reorder_level: v }))} placeholder="0" keyboardType="numeric" />
        <TextField label="Unit cost (cents)" value={form.unit_cost_cents} onChangeText={(v) => setForm((f) => ({ ...f, unit_cost_cents: v }))} placeholder="0" keyboardType="numeric" />
        <TextField label="Linked menu item ID" value={form.menu_item_id} onChangeText={(v) => setForm((f) => ({ ...f, menu_item_id: v }))} placeholder="Optional menu_items.id" />
        <View className="flex-row items-center gap-3">
          <Button label={form.is_active ? "In Stock" : "Inactive"} variant={form.is_active ? "secondary" : "ghost"} onPress={() => setForm((f) => ({ ...f, is_active: !f.is_active }))} />
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Toggle stock record availability</Text>
        </View>
        {menuItems.length > 0 ? (
          <Text className={`font-outfit text-xs ${cx.textInk60}`}>Tip: copy a menu item ID from Menu Items audit to link stock to a menu item.</Text>
        ) : null}
        <View className="flex-row flex-wrap items-center gap-3 pt-1">
          <Button label="Create item" onPress={onSave} loading={saving} disabled={syncing && !saving} />
          <Button label="Clear" variant="ghost" onPress={onReset} disabled={saving} />
        </View>
      </View>
    </AccordionSection>
  );
}
