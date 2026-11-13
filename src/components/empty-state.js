import { Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Empty state message component.
 * @module components/empty-state
 */

/**
 * @typedef {object} EmptyStateProps
 * @property {string} message - Message text.
 */

/**
 * Displays a consistent empty-state message card without inner background fill.
 *
 * @param {EmptyStateProps} props - Component props.
 * @returns {JSX.Element | null} Empty state element or `null` when no message.
 */
export function EmptyState({ message }) {
  if (!message) {
    return null;
  }

  return (
    <View className={`w-full rounded-2xl border ${cx.borderSubtle} px-4 py-3`}>
      <Text className={`font-outfit text-sm leading-relaxed ${cx.textInk70}`}>
        {message}
      </Text>
    </View>
  );
}
