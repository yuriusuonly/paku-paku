import { Text, TextInput, View } from "react-native";
import { alpha, cx } from "../shared/constants/theme.js";

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
 * @property {string} [keyboardType] - Keyboard type.
 * @property {boolean} [multiline] - Whether to allow multiple lines.
 * @property {number} [numberOfLines] - Suggested number of visible lines when multiline.
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
  autoComplete,
  keyboardType,
  multiline = false,
  numberOfLines
}) {
  return (
    <View className="w-full">
      <Text className={`font-outfit mb-2 text-sm font-semibold ${cx.textInk}`}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={alpha.ink35}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        className={`font-outfit w-full rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} px-4 py-3 text-base ${cx.textInk} ${multiline ? "min-h-[96px]" : ""}`}
      />
    </View>
  );
}
