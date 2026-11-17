import { Link } from "expo-router";
import { Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Fallback route (`src/app/+not-found.js`) rendered when no route matches.
 * @module app/+not-found
 */

/**
 * Minimal 404 screen with a link back to the home route.
 *
 * @returns {JSX.Element} Centered not-found message.
 */
export default function NotFound() {
  return (
    <View className={`flex-1 items-center justify-center ${cx.bgApp} ${cx.spacing.cardPad}`}>
      <Text className={`text-center ${cx.typography.display} ${cx.textInk}`}>
        404
      </Text>
      <Text className={`mt-3 text-center ${cx.typography.body} ${cx.textInk70}`}>
        This page does not exist.
      </Text>
      <Link href="/" className="mt-6">
        <Text className={`text-center ${cx.typography.body} font-semibold ${cx.textPrimary}`}>
          ← Back home
        </Text>
      </Link>
    </View>
  );
}
