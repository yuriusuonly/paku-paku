import { View } from "react-native";
import { Button } from "./button.js";

/**
 * Standardized create/edit form action row.
 * @module components/form-actions
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function FormActions({
  onSave,
  onClear,
  saveLabel = "Save",
  clearLabel = "Clear",
  saving = false,
  disabled = false,
  children = null
}) {
  return (
    <View className={`flex-row flex-wrap items-center ${cx.spacing.md}`}>
      <Button label={saveLabel} onPress={onSave} loading={saving} disabled={disabled} />
      {onClear ? <Button label={clearLabel} variant="ghost" onPress={onClear} disabled={saving || disabled} /> : null}
      {children}
    </View>
  );
}
