import { View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Button } from "../../../components/button.js";
import { FormActions } from "../../../components/form-actions.js";
import { TextField } from "../../../components/text-field.js";

/**
 * New item form section.
 * @module screens/admin/items/item-form.component
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function ItemFormSection({ form, setForm, fieldErrors, setFieldErrors, saving, onSave, onReset, expanded, onToggleExpanded }) {
  return (
    <AccordionSection title="New item" expanded={expanded} onToggle={onToggleExpanded} className="mt-4">
      <View className="gap-3">
        <TextField
          label="Name (*)"
          value={form.name}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, name: v }));
            if (fieldErrors.name) setFieldErrors((current) => ({ ...current, name: false }));
          }}
          placeholder="Takoyaki"
          error={fieldErrors.name}
        />
        <TextField
          label="Description"
          value={form.description}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, description: v }));
            if (fieldErrors.description) setFieldErrors((current) => ({ ...current, description: false }));
          }}
          placeholder="Description"
          multiline
          numberOfLines={4}
          error={fieldErrors.description}
        />
        <TextField
          label="Price (cents)"
          value={form.price_cents}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, price_cents: v }));
            if (fieldErrors.price_cents) setFieldErrors((current) => ({ ...current, price_cents: false }));
          }}
          placeholder="0"
          keyboardType="numeric"
          error={fieldErrors.price_cents}
        />
        <TextField
          label="Sort order"
          value={form.sort_order}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, sort_order: v }));
            if (fieldErrors.sort_order) setFieldErrors((current) => ({ ...current, sort_order: false }));
          }}
          placeholder="Auto"
          keyboardType="numeric"
          error={fieldErrors.sort_order}
        />
        <View className="flex-row flex-wrap items-center gap-3">
          <Button label={form.is_available ? "Available" : "Unavailable"} variant="ghost" onPress={() => setForm((f) => ({ ...f, is_available: !f.is_available }))} />
          <Button label={form.is_best_seller ? "Best seller" : "Regular"} variant="ghost" onPress={() => setForm((f) => ({ ...f, is_best_seller: !f.is_best_seller }))} />
        </View>
        <FormActions onSave={onSave} onClear={onReset} saveLabel="Create item" saving={saving} />
      </View>
    </AccordionSection>
  );
}
