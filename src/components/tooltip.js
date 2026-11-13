import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Reusable tooltip component.
 * @module components/tooltip
 */

/**
 * @typedef {object} TooltipProps
 * @property {string} message - Tooltip message.
 * @property {"error" | "info" | "success"} [variant] - Visual variant.
 * @property {"top" | "bottom"} [placement] - Tooltip placement relative to anchor.
 * @property {boolean} [visible] - Controlled visibility. When omitted, visibility follows hover/focus/press for wrapped children or is always shown for standalone usage.
 * @property {import("react").ReactNode} [children] - Optional anchor element. When provided, tooltip behavior is attached to this element.
 */

/**
 * Displays a tooltip bubble with pointer.
 *
 * @param {{message: string, variant: "error" | "info" | "success", placement: "top" | "bottom"}} props
 * @returns {JSX.Element | null}
 */
function TooltipBubble({ message, variant, placement }) {
  if (!message) return null;

  const variantStyle = cx.alert[variant] || cx.alert.info;
  const arrowStyle =
    variant === "error"
      ? `${cx.bgPrimarySoft} ${cx.borderPrimary20}`
      : variant === "success"
        ? "border-emerald-200 bg-emerald-50"
        : `${cx.bgSurfaceSoft} ${cx.borderSubtle}`;

  const isTop = placement === "top";

  return (
    <View
      pointerEvents="none"
      className={`absolute left-0 z-50 max-w-[280px] ${isTop ? "bottom-full mb-2" : "top-full mt-2"}`}
    >
      {!isTop ? <View className={`ml-4 mb-[-5px] h-2.5 w-2.5 rotate-45 border-l border-t ${arrowStyle}`} /> : null}
      <View className={`rounded-lg border px-3 py-2 shadow-lg ${variantStyle}`}>
        <Text className={`font-outfit text-sm leading-snug ${variantStyle}`}>{message}</Text>
      </View>
      {isTop ? <View className={`ml-4 -mt-1.5 h-2.5 w-2.5 rotate-45 border-b border-r ${arrowStyle}`} /> : null}
    </View>
  );
}

/**
 * Displays a floating tooltip. When used without children it renders as a standalone
 * anchored bubble at its position. When used with children it attaches tooltip behavior
 * to the wrapped anchor.
 *
 * @param {TooltipProps} props - Component props.
 * @returns {JSX.Element | null} Tooltip element or `null`.
 */
export function Tooltip({
  message,
  variant = "error",
  placement = "top",
  visible,
  children
}) {
  const [active, setActive] = useState(false);

  if (!message) {
    if (children) return <>{children}</>;
    return null;
  }

  if (!children) {
    return (
      <View className="relative z-20 h-0 w-full">
        <TooltipBubble message={message} variant={variant} placement={placement} />
      </View>
    );
  }

  const isVisible = typeof visible === "boolean" ? visible : active;

  return (
    <View className="relative">
      <Pressable
        onHoverIn={() => setActive(true)}
        onHoverOut={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        onPressIn={() => setActive(true)}
        onPressOut={() => setActive(false)}
      >
        {children}
      </Pressable>
      {isVisible ? <TooltipBubble message={message} variant={variant} placement={placement} /> : null}
    </View>
  );
}
