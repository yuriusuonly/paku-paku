import { Text, TextInput, View } from "react-native";

/**
 * Labeled text input component.
 * @module components/text-field
 */

/**
 * @typedef {object} TextFieldProps
 * @property {string} label - Field label.
 * @property {string} value - Current value.
 * @property {(value: string) => void} onChangeText - Change handler.
 * @property {string} [placeholder] - Placeholder text.
 * @property {boolean} [secureTextEntry] - Whether to obscure text.
 * @property {string} [autoCapitalize] - Auto-capitalization mode.
 * @property {string} [autoComplete] - Auto-complete hint.
 */

/**
 * Accessible labeled input field.
 *
 * @param {TextFieldProps} props - Component props.
 * @returns {JSX.Element} Text field.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = "none",
  autoComplete
}) {
  return (
    <View className="w-full">
      <Text className="font-outfit mb-2 text-sm font-semibold text-[#161823]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(22,24,35,0.35)"
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        className="font-outfit w-full rounded-2xl border border-[#161823]/10 bg-[#161823]/[0.03] px-4 py-3 text-base text-[#161823]"
      />
    </View>
  );
}
