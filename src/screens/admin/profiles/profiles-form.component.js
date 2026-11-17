import { Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { FormActions } from "../../../components/form-actions.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin create-user form section.
 * @module screens/admin/profiles/profiles-form.component
 */

export function ProfilesFormSection({ form, setForm, fieldErrors, setFieldErrors, saving, onSave, onClear, expanded, onToggleExpanded }) {
  return (
    <AccordionSection title="Add user" expanded={expanded} onToggle={onToggleExpanded} className="mt-2">
      <View className="gap-3">
        <Text className={`font-outfit text-sm ${cx.textInk70}`}>Create a customer account and profile.</Text>
        <TextField
          label="Email (*)"
          value={form.email}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, email: v }));
            if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: false }));
          }}
          placeholder="example@email.com"
          error={fieldErrors.email}
        />
        <TextField
          label="Password (*)"
          value={form.password}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, password: v }));
            if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: false }));
          }}
          placeholder="At least 6 characters"
          secureTextEntry
          enablePasswordToggle
          error={fieldErrors.password}
        />
        <TextField
          label="Confirm password (*)"
          value={form.confirmPassword || ""}
          onChangeText={(v) => {
            setForm((f) => ({ ...f, confirmPassword: v }));
            if (fieldErrors.confirmPassword) setFieldErrors((current) => ({ ...current, confirmPassword: false }));
          }}
          placeholder="Re-enter password"
          secureTextEntry
          enablePasswordToggle
          error={fieldErrors.confirmPassword}
        />
        <FormActions onSave={onSave} onClear={onClear} saveLabel="Create user" saving={saving} />
      </View>
    </AccordionSection>
  );
}
