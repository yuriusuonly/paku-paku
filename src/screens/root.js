import { useEffect } from "react";
import { useRouter } from "expo-router";
import { Image, Text, View } from "react-native";
import logo from "../../png/logo.png";
import { Header } from "../components/header.js";
import { CircularProgress } from "../components/circular-progress.js";
import { ScreenContainer } from "../components/container.js";
import config from "../shared/constants/config.js";
import { useAuthStore } from "../stores/auth-store.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Landing/home screen.
 * @module screens/root
 */

/**
 * Home screen component.
 *
 * @returns {JSX.Element} Home screen.
 */
export default function HomeScreen() {
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);
  const hydrated = useAuthStore((state) => state.hydrated);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && authStatus === "authenticated") {
      router.replace("/menu");
    }
  }, [hydrated, authStatus, router]);

  const authReady = hydrated && authStatus !== "loading" && authStatus !== "idle";

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

      {!authReady || authStatus === "authenticated" ? (
        <CircularProgress message={!authReady ? "Checking your session..." : "Redirecting..."} />
      ) : null}
    </ScreenContainer>
  );
}
