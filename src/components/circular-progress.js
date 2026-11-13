import { ActivityIndicator, View } from "react-native";

/**
 * Circular loading indicator.
 * @module components/circular-progress
 */

/**
 * @param {{size?: "small" | "large" | number, color?: string, className?: string}} props
 * @returns {JSX.Element}
 */
export function CircularProgress({ size = "small", color = "#FE2C55", className = "" }) {
  return (
    <View className={`items-center justify-center ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
