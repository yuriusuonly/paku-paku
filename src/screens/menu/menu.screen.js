import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { EmptyState } from "../../components/empty-state.js";
import { OptionChip } from "../../components/option-chip.js";
import { Header } from "../../components/header.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { ScreenContainer } from "../../components/container.js";
import { formatCurrencyCents } from "../../shared/format/currency.js";
import { getMenuSections } from "../../domain/menu/sections.js";
import { buildComboCartItem } from "../../domain/menu/combo.js";
import { useCartStore } from "../../stores/cart.store.js";
import { useItemsStore } from "../../stores/items.store.js";
import { useNotificationStore } from "../../stores/notification.store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Public kiosk menu screen.
 * @module screens/menu/menu.screen
 */

/**
 * Menu screen component.
 *
 * @returns {JSX.Element} Menu screen.
 */
export default function MenuScreen() {
  const items = useItemsStore((state) => state.items);
  const loading = useItemsStore((state) => state.loading);
  const syncing = useItemsStore((state) => state.syncing);
  const error = useItemsStore((state) => state.error);
  const fetchItems = useItemsStore((state) => state.fetchItems);
  const subscribe = useItemsStore((state) => state.subscribe);
  const unsubscribe = useItemsStore((state) => state.unsubscribe);

  const hydrateCart = useCartStore((state) => state.hydrate);
  const addToCart = useCartStore((state) => state.addItem);
  const setCartQuantity = useCartStore((state) => state.setQuantity);
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const showSuccess = useNotificationStore((state) => state.showSuccess);

  const [comboFoodId, setComboFoodId] = useState(null);
  const [comboDrinkId, setComboDrinkId] = useState(null);

  useEffect(() => {
    hydrateCart();
  }, [hydrateCart]);

  useEffect(() => {
    void fetchItems().catch(() => {});
    subscribe();
    return () => {
      void unsubscribe();
    };
  }, [fetchItems, subscribe, unsubscribe]);

  const visibleItems = items.filter((item) => item?.is_available !== false);
  const menuSections = getMenuSections(items);
  const foodItems = menuSections.find((section) => section.key === "food")?.items || [];
  const drinkItems = menuSections.find((section) => section.key === "beverage")?.items || [];
  const comboFood = foodItems.find((item) => item.id === comboFoodId) || foodItems[0] || null;
  const comboDrink = drinkItems.find((item) => item.id === comboDrinkId) || drinkItems[0] || null;
  const comboItem = buildComboCartItem(comboFood, comboDrink);
  const showInitialMenuLoading = loading && visibleItems.length === 0;

  const addCombo = () => {
    if (!comboItem) return;
    addToCart(comboItem);
    showSuccess(`${comboItem.item_name} added to cart.`);
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />

      <View className="mb-4 flex-row items-end justify-between">
        <View>
          <Text className={`${cx.typography.title} ${cx.textInk}`}>Menu</Text>
          <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
            Add items to your cart, then place an order. Cart: {cartCount}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>{visibleItems.length} items</Text>
          {syncing && visibleItems.length > 0 ? <CircularProgress size="small" /> : null}
        </View>
      </View>

      {error ? <Alert variant="error" message={error} /> : null}

      {showInitialMenuLoading ? (
        <CircularProgress message="Loading items..." />
      ) : null}

      {!loading && !error && visibleItems.length === 0 ? (
        <EmptyState message="No items are available right now." />
      ) : null}

      {foodItems.length > 0 && drinkItems.length > 0 ? (
        <View className={`mt-4 ${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
          <View>
            <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>Build a combo</Text>
            <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
              Choose one main dish and add any side drink.
            </Text>
          </View>

          <View className="mt-2">
            <Text className={`${cx.typography.label} ${cx.textInk60}`}>1. Main dish</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {foodItems.map((item) => (
                <OptionChip
                  key={item.id}
                  label={item.name}
                  caption={formatCurrencyCents(item.price_cents)}
                  selected={comboFood?.id === item.id}
                  onPress={() => setComboFoodId(item.id)}
                />
              ))}
            </View>
          </View>

          <View className="mt-2">
            <Text className={`${cx.typography.label} ${cx.textInk60}`}>2. Side drink add-on</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {drinkItems.map((item) => (
                <OptionChip
                  key={item.id}
                  label={item.name}
                  caption={formatCurrencyCents(item.price_cents)}
                  selected={comboDrink?.id === item.id}
                  onPress={() => setComboDrinkId(item.id)}
                />
              ))}
            </View>
          </View>

          <View className="mt-3 flex-row flex-wrap items-center justify-between gap-3">
            <Text className={`font-outfit text-lg font-bold ${cx.textPrimary}`}>
              {comboItem ? formatCurrencyCents(comboItem.unit_price_cents) : "-"}
            </Text>
            <Button label="Add combo to cart" onPress={addCombo} disabled={!comboItem} />
          </View>
        </View>
      ) : null}

      {menuSections.length > 0 ? (
        <View className={`mt-4 gap-8 ${syncing ? "opacity-80" : "opacity-100"}`}>
          {menuSections.map((section) => (
            <View key={section.key}>
              <Text className={`font-outfit mb-3 text-xl font-black tracking-tight ${cx.textInk}`}>
                {section.title}
              </Text>
              <View className="-mx-2 flex-row flex-wrap">
                {section.items.map((item) => {
                  const cartItem = cartItems.find(
                    (entry) => (entry.item_id || entry.item_name) === item.id
                  );
                  const quantity = Number(cartItem?.quantity || 0);

                  return (
                    <View key={item.id} className="w-full p-2 md:w-1/2">
                      <View className={`h-full ${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad}`}>
                        <View className="flex-1 flex-row items-start justify-between gap-4">
                          <View className="flex-1">
                            <View className="flex-row flex-wrap items-center gap-2">
                              <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>
                                {item.name}
                              </Text>
                              {item.is_best_seller ? (
                                <View className={`rounded-full ${cx.bgPrimarySoft} px-2.5 py-1`}>
                                  <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textPrimary}`}>
                                    Best seller
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            {item.description ? (
                              <Text className={`font-outfit mt-2 text-sm md:text-base leading-relaxed ${cx.textInk70}`}>
                                {item.description}
                              </Text>
                            ) : null}
                            <View className="mt-4 flex-row items-center gap-3">
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={`Remove one ${item.name} from cart`}
                                  onPress={() => {
                                    if (quantity > 0) {
                                      setCartQuantity(item.id, quantity - 1);
                                    }
                                  }}
                                  className={`h-11 w-11 items-center justify-center rounded-full border ${cx.borderSubtle} ${cx.bgSurfaceSoft}`}
                                >
                                  <Text className={`${cx.typography.title} ${cx.textInk}`}>-</Text>
                                </Pressable>
                                <Text className={`font-outfit min-w-[32px] text-center text-lg font-semibold ${cx.textInk}`}>
                                  {quantity}
                                </Text>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityLabel={`Add one ${item.name} to cart`}
                                  onPress={() => {
                                    if (quantity === 0) {
                                      addToCart({
                                        item_id: item.id,
                                        item_name: item.name,
                                        unit_price_cents: Number(item.price_cents || 0),
                                        quantity: 1
                                      });
                                      showSuccess(`${item.name} added to cart.`);
                                    } else {
                                      setCartQuantity(item.id, quantity + 1);
                                    }
                                  }}
                                  className={`h-11 w-11 items-center justify-center rounded-full ${cx.bgPrimary}`}
                                >
                                  <Text className={`font-outfit text-2xl font-bold ${cx.textWhite}`}>+</Text>
                                </Pressable>
                              </View>
                          </View>
                          <View className="items-end">
                            <Text className={`font-outfit text-lg font-bold ${cx.textPrimary}`}>
                              {formatCurrencyCents(item.price_cents)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
