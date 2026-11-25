import { Link } from "expo-router";
import { Image, Text, View } from "react-native";
import logo from "../png/logo.png";
import { Header } from "../components/header.js";
import { Button } from "../components/button.js";
import { ScreenContainer } from "../components/container.js";
import config from "../shared/constants/config.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Storefront landing screen.
 * @module screens/root
 */

/**
 * @returns {JSX.Element} Home screen.
 */
export default function HomeScreen() {
  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <View className="w-full flex-1 items-center justify-center py-2">
        <View className="w-full flex-col-reverse items-stretch gap-2 md:flex-row md:items-center md:gap-8">
          <View className="w-full items-center justify-start text-center md:flex-1 md:items-start md:justify-center md:text-left">
            <Text className={`text-center md:text-left ${cx.typography.display} ${cx.textInk}`}>
              {config.title}
            </Text>
            <Text className={`font-outfit mt-4 max-w-2xl text-center text-base md:text-left md:text-lg leading-relaxed ${cx.textInk70}`}>
              {config.description}
            </Text>
            <View className="mt-6 flex-row flex-wrap justify-center md:justify-start">
              <Link href="/menu" asChild>
                <Button label="Start ordering" />
              </Link>
            </View>
          </View>
          <View className="w-full items-center justify-end md:flex-1 md:justify-center">
            <Image
              source={logo}
              accessibilityLabel={`${config.title} logo`}
              resizeMode="contain"
              className="max-h-40 max-w-full md:max-h-80"
              style={{ objectFit: "contain", objectPosition: "50% 50%" }}
            />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
