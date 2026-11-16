import { Text, View } from "react-native";
import { Button } from "../../../components/button.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * New menu item form section.
 * @module screens/admin/menu-items/menu-item-form-component
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function MenuItemFormSection({ form, setForm, fieldErrors, setFieldErrors, saving, onSave, onReset }) {
  return (
    <View className={`mt-4 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
      <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>New item</Text>
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
        <Button label="Create item" onPress={onSave} loading={saving} />
        <Button label="Clear" variant="ghost" onPress={onReset} />
      </View>
    </View>
  );
}
