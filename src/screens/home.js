import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../components/alert.js";
import { Header } from "../components/header.js";
import { ScreenContainer } from "../components/container.js";
import config from "../shared/config.js";
import { getMenuItems } from "../services/client/menu-client.js";

/**
 * Home/storefront screen with menu loaded from the API.
 * @module screens/home
 */

/**
 * Formats a price in cents as a currency string.
 *
 * @param {number} cents - Price in cents.
 * @returns {string} Formatted price.
 */
function formatPrice(cents) {
  return `¥${(cents / 100).toFixed(0)}`;
}

/**
 * Home screen component.
 *
 * @returns {JSX.Element} Home screen.
 */
export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMenuItems()
      .then((data) => {
        if (active) {
          setItems(data.items || []);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.message || "Could not load the menu.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />

        <View className="mb-10">
          <Text className="font-outfit text-4xl md:text-6xl font-black tracking-tight text-[#161823]">
            {config.title}
          </Text>
          <Text className="font-outfit mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-[#161823]/70">
            {config.description}
          </Text>
        </View>

        <View className="mb-4 flex-row items-end justify-between">
          <Text className="font-outfit text-2xl font-bold text-[#161823]">
            Menu
          </Text>
          <Text className="font-outfit text-sm text-[#161823]/50">
            {loading ? "Loading..." : `${items.length} items`}
          </Text>
        </View>

        {error ? <Alert variant="error" message={error} /> : null}

        {!loading && !error && items.length === 0 ? (
          <Alert variant="info" message="No menu items are available right now." />
        ) : null}

        <View className="mt-4 gap-4">
          {items.map((item) => (
            <View
              key={item.id}
              className="rounded-3xl border border-[#161823]/10 bg-[#161823]/[0.02] p-5 md:p-6"
            >
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="font-outfit text-xl font-bold text-[#161823]">
                    {item.name}
                  </Text>
                  {item.description ? (
                    <Text className="font-outfit mt-2 text-sm md:text-base leading-relaxed text-[#161823]/70">
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text className="font-outfit text-lg font-bold text-[#FE2C55]">
                  {formatPrice(item.price_cents)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
