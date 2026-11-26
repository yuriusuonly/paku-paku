import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { alpha, cx } from "../constants/theme.js";

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
 * @property {boolean} [enablePasswordToggle] - Whether to show a password visibility toggle for secure fields.
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
  enablePasswordToggle = false,
  autoCapitalize = "none",
  autoComplete,
  keyboardType,
  multiline = false,
  numberOfLines,
  error = false
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const canTogglePassword = secureTextEntry && enablePasswordToggle && !multiline;
  const isSecure = secureTextEntry && !passwordVisible;

  return (
    <View className="w-full">
      <Text className={`${cx.typography.label} mb-2 ${cx.textInk}`}>
        {label}
      </Text>
      <View className="relative w-full">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={alpha.ink35}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
          className={`${cx.typography.body} w-full min-h-[44px] ${cx.radius.md} border ${error ? cx.borderPrimary : cx.borderSubtle} ${cx.bgSurfaceSoft} px-3 py-3 sm:px-4 ${cx.textInk} ${multiline ? "min-h-[96px]" : ""} ${canTogglePassword ? "pr-16" : ""}`}
        />
        {canTogglePassword ? (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            className="absolute right-3 top-0 h-full items-center justify-center"
            hitSlop={8}
          >
            <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>
              {passwordVisible ? "Hide" : "Show"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
