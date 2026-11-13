import { Text, View } from "react-native";
import { cx } from "../shared/theme.js";

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

  return (
    <View className={`w-full rounded-2xl border px-4 py-3 ${styles[variant] || styles.info}`}>
      <Text className={`font-outfit text-sm leading-relaxed ${styles[variant] || styles.info}`}>
        {message}
      </Text>
    </View>
  );
}
