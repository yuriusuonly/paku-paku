import { Link } from "expo-router";
import { Text, View } from "react-native";

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
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="font-outfit text-6xl font-black tracking-tight text-[#161823]">
        404
      </Text>
      <Text className="font-outfit mt-3 text-base text-[#161823]/70">
        This page does not exist.
      </Text>
      <Link href="/" className="mt-6">
        <Text className="font-outfit text-base font-semibold text-[#FE2C55]">
          ← Back home
        </Text>
      </Link>
    </View>
  );
}
