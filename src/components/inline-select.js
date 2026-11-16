import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Inline dropdown select for table fields.
 * @module components/inline-select
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function InlineSelect({ value, options, onChange, disabled = false, accessibilityLabel }) {
  const [open, setOpen] = useState(false);
  const current = value == null || value === "" ? "-" : String(value);
  const label = accessibilityLabel || current;

  const close = () => setOpen(false);

  return (
    <View style={{ position: "relative" }}>
      <Pressable
        onPress={() => { if (!disabled) setOpen((v) => !v); }}
        onKeyPress={(event) => {
          if (event?.nativeEvent?.key === "Escape") close();
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: open }}
        className={`rounded-lg border ${open ? cx.borderPrimary30 : cx.borderSubtle} ${cx.bgSurfaceSoft} px-2 py-1 ${disabled ? "opacity-50" : ""}`}
      >
        <Text className={`font-outfit text-sm font-bold ${cx.textInk}`}>{current}</Text>
      </Pressable>
      {open ? (
        <View className={`absolute left-0 top-9 z-50 min-w-[140px] rounded-xl border ${cx.borderSubtle} ${cx.bgSurface} p-1 shadow-sm`}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                close();
                if (option !== value) void onChange(option);
              }}
              accessibilityRole="button"
              accessibilityLabel={String(option)}
              className={`rounded-lg px-3 py-2 ${option === value ? cx.bgSurfaceMuted : ""}`}
            >
              <Text className={`font-outfit text-sm ${cx.textInk}`}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
