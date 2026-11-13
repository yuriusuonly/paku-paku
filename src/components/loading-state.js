import { Text, View } from "react-native";
import { CircularProgress } from "./circular-progress.js";

/**
 * Loading state block with circular progress and message.
 * @module components/loading-state
 */

/**
 * @param {{message?: string, className?: string, size?: "small" | "large" | number}} props
 * @returns {JSX.Element}
 */
export function LoadingState({ message = "Loading...", className = "", size = "large" }) {
  return (
    <View className={`items-center justify-center gap-3 py-8 ${className}`}>
      <CircularProgress size={size} />
      {message ? (
        <Text className="font-outfit text-sm text-[#161823]/60">{message}</Text>
      ) : null}
    </View>
  );
}
