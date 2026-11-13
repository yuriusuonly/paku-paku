import { Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

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

  if (variant === "error") {
    return (
      <Text className={`font-outfit w-full text-sm leading-relaxed ${cx.textError}`}>
        {message}
      </Text>
    );
  }

  const styles = cx.alert;
  const variantStyle = styles[variant] || styles.info;

  return (
    <View className={`w-full rounded-2xl border px-4 py-3 ${variantStyle}`}>
      <Text className={`font-outfit text-sm leading-relaxed ${variantStyle}`}>
        {message}
      </Text>
    </View>
  );
}
