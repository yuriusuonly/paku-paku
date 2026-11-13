import { Text, View } from "react-native";

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

  const styles = {
    error: "border-[#FE2C55]/20 bg-[#FE2C55]/10 text-[#9f1239]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-[#161823]/10 bg-[#161823]/[0.03] text-[#161823]/80"
  };

  return (
    <View className={`w-full rounded-2xl border px-4 py-3 ${styles[variant]}`}>
      <Text className={`font-outfit text-sm leading-relaxed ${styles[variant]}`}>
        {message}
      </Text>
    </View>
  );
}
