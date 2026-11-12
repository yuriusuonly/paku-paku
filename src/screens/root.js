import { Text, View } from "react-native";
import config from "../shared/config.js";

/**
 * Home screen (`src/screens/root.js`): intentionally minimal starter content
 * for the empty app shell.
 * @module screens/root
 */

/**
 * Centered app title and description sourced from shared config.
 *
 * @returns {JSX.Element} The empty starter screen.
 */
export default function RootScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text className="font-outfit text-4xl md:text-5xl font-black tracking-tight text-[#161823]">
        {config.title}
      </Text>
      <Text className="font-outfit mt-4 max-w-xl text-center text-base md:text-lg leading-relaxed text-[#161823]/70">
        {config.description}
      </Text>
    </View>
  );
}
