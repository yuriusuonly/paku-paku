import { Text, View } from "react-native";
import { cx } from "../constants/theme.js";

/**
 * Inline alert/message component.
 * @module components/alert
 */

/**
 * @typedef {object} AlertProps
 * @property {string} message - Message text.
 * @property {"error" | "success" | "info"} [variant] - Visual variant.
 */

/**
 * Displays a contextual message.
 *
 * @param {AlertProps} props - Component props.
 * @returns {JSX.Element | null} Alert element or `null` when no message.
 */
export function Alert({ message, variant = "info" }) {
  if (!message) {
    return null;
  }

  const styles = cx.alert;
  const variantStyle = styles[variant] || styles.info;
  const textStyle =
    variant === "error" ? cx.textError : variant === "success" ? "text-emerald-800" : cx.textInk80;

  return (
    <View className={`w-full ${cx.radius.md} border px-4 py-3 ${variantStyle}`}>
      <Text className={`${cx.typography.body} ${textStyle}`}>
        {message}
      </Text>
    </View>
  );
}
