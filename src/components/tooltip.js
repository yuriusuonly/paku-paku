import { Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Floating tooltip component.
 * @module components/tooltip
 */

/**
 * @typedef {object} TooltipProps
 * @property {string} message - Tooltip message.
 * @property {"error" | "info" | "success"} [variant] - Visual variant.
 */

/**
 * Displays a floating tooltip message.
 *
 * @param {TooltipProps} props - Component props.
 * @returns {JSX.Element | null} Tooltip element or `null` when no message.
 */
export function Tooltip({ message, variant = "error" }) {
  if (!message) {
    return null;
  }

  const variantStyle = cx.alert[variant] || cx.alert.info;

  return (
    <View className="relative z-20 w-full">
      <View className={`absolute left-0 top-0 w-full rounded-xl border px-3 py-2 shadow-md ${variantStyle}`}>
        <Text className={`font-outfit text-sm leading-relaxed ${variantStyle}`}>
          {message}
        </Text>
      </View>
    </View>
  );
}
