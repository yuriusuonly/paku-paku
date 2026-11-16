import { Pressable, Text, View } from "react-native";
import { AccordionSection } from "../../../components/accordion.js";
import { Button } from "../../../components/button.js";
import { TextField } from "../../../components/text-field.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin create-user form section.
 * @module screens/admin/profiles/profiles-form-component
 */

export function ProfilesFormSection({ form, setForm, fieldErrors, setFieldErrors, saving, createdRecoveryCode, onSave, onClear, onCopyRecoveryCode, expanded, onToggleExpanded }) {
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
        <View className="flex-row items-center gap-3">
          <Button label="Create user" onPress={onSave} loading={saving} />
          <Button label="Clear" variant="ghost" onPress={onClear} />
        </View>
        {createdRecoveryCode ? (
          <View className={`mt-2 gap-2 rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4`}>
            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Recovery code (show once)</Text>
            <Text selectable className={`font-outfit text-base font-bold tracking-widest ${cx.textInk}`}>{createdRecoveryCode}</Text>
            <Pressable onPress={onCopyRecoveryCode} className="self-start">
              <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>Copy</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </AccordionSection>
  );
}
