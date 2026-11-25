import { ActivityIndicator, Text, View } from "react-native";
import { colors, cx } from "../shared/constants/theme.js";

/**
 * Circular progress/loading indicator (single source of truth).
 * @module components/circular-progress
 */

/**
 * @param {{size?: "small" | "large" | number, color?: string, className?: string, message?: string}} props
 * @returns {JSX.Element}
 */
export function CircularProgress({ size = "small", color = colors.primary, className = "", message }) {
  if (message) {
    return (
      <View className={`items-center justify-center gap-3 py-8 ${className}`}>
        <ActivityIndicator size={size === "small" ? "large" : size} color={color} />
        <Text className={`${cx.typography.body} ${cx.textInk60}`}>{message}</Text>
      </View>
    );
  }

  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
