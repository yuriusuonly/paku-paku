import { ActivityIndicator, Text, View } from "react-native";

/**
 * Circular progress/loading indicator (single source of truth).
 * @module components/circular-progress
 */

/**
 * @param {{size?: "small" | "large" | number, color?: string, className?: string, message?: string}} props
 * @returns {JSX.Element}
 */
export function CircularProgress({ size = "small", color = "#FE2C55", className = "", message }) {
  if (message) {
    return (
      <View className={`items-center justify-center gap-3 py-8 ${className}`}>
        <ActivityIndicator size={size === "small" ? "large" : size} color={color} />
        <Text className="font-outfit text-sm text-[#161823]/60">{message}</Text>
      </View>
    );
  }

  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
