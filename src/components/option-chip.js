import { Pressable, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Selectable chip used for exclusive option pickers.
 * @module components/option-chip
 */

/**
 * @param {{label: string, caption?: string|null, selected?: boolean, onPress: () => void, disabled?: boolean}} props
 * @returns {JSX.Element}
 */
export function OptionChip({ label, caption, selected = false, onPress, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      className={`min-h-[44px] min-w-[140px] flex-1 items-center justify-center rounded-full border px-4 py-2 ${
        selected ? `${cx.bgPrimary} ${cx.borderPrimary}` : `${cx.bgSurfaceSoft} ${cx.borderSubtle}`
      } ${disabled ? "opacity-50" : ""}`}
    >
      <View className="items-center">
        <Text className={`font-outfit text-sm font-semibold ${selected ? cx.textWhite : cx.textInk}`}>
          {label}
        </Text>
        {caption ? (
          <Text className={`font-outfit text-xs ${selected ? cx.textWhite60 : cx.textInk60}`}>
            {caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
