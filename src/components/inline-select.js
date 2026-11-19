import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Inline dropdown select for table fields.
 *
 * Options render in a modal portal so they are never clipped by table rows,
 * horizontal scroll containers, or overflow-hidden cards.
 * @module components/inline-select
 */

const MENU_WIDTH = 170;
const OPTION_HEIGHT = 40;
const MENU_PADDING = 8;

/**
 * Computes a viewport-safe position for the options menu.
 *
 * @param {{x: number, y: number}} anchor - Press coordinates.
 * @param {string[]} options - Selectable options.
 * @returns {{left: number, top: number}}
 */
function getMenuPosition(anchor, options) {
  const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight;
  const menuHeight = options.length * OPTION_HEIGHT + MENU_PADDING * 2;
  const left = Math.max(8, Math.min(anchor.x, viewportWidth - MENU_WIDTH - 8));
  const below = anchor.y + 36;
  const top = below + menuHeight > viewportHeight
    ? Math.max(8, anchor.y - menuHeight - 8)
    : below;
  return { left, top };
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function InlineSelect({ value, options, onChange, disabled = false, accessibilityLabel }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const current = value == null || value === "" ? "-" : String(value);
  const label = accessibilityLabel || current;
  const position = getMenuPosition(anchor, options);

  const openMenu = (event) => {
    if (disabled) return;
    const nativeEvent = event?.nativeEvent || {};
    const x = nativeEvent.pageX ?? nativeEvent.clientX ?? 0;
    const y = nativeEvent.pageY ?? nativeEvent.clientY ?? 0;
    setAnchor({ x, y });
    setOpen(true);
  };

  const select = (option) => {
    setOpen(false);
    if (option !== value) void onChange(option);
  };

  return (
    <>
      <Pressable
        onPress={openMenu}
        onKeyPress={(event) => {
          if (event?.nativeEvent?.key === "Escape") setOpen(false);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: open }}
        className={`${cx.radius.sm} border ${open ? cx.borderPrimary30 : cx.borderSubtle} ${cx.bgSurfaceSoft} px-2 py-1 ${disabled ? "opacity-50" : ""}`}
      >
        <Text className={`font-outfit text-sm font-bold ${cx.textInk}`}>{current}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onStartShouldSetResponder={() => {
            setOpen(false);
            return true;
          }}
        >
          <View
            style={{ position: "absolute", left: position.left, top: position.top, width: MENU_WIDTH }}
            onStartShouldSetResponder={() => true}
            className={`border ${cx.borderSubtle} ${cx.bgWhite} p-1 ${cx.radius.md} shadow-lg`}
          >
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => select(option)}
                accessibilityRole="button"
                accessibilityLabel={String(option)}
                className={`${cx.radius.sm} px-3 py-2 ${option === value ? cx.bgSurfaceMuted : ""}`}
              >
                <Text className={`font-outfit text-sm ${cx.textInk}`}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}
