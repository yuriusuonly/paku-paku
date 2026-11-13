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
 * @property {"start" | "center" | "end"} [align] - Horizontal alignment relative to anchor.
 * @property {number} [offset] - Distance from anchor in pixels.
 * @property {boolean} [visible] - Controlled visibility. When omitted, visibility follows hover/focus/press for wrapped children or is always shown for standalone usage.
 * @property {import("react").ReactNode} [children] - Optional anchor element. When provided, tooltip behavior is attached to this element.
 * @property {string} [className] - Additional classes for the anchor/wrapper container.
 */

/**
 * Displays a tooltip bubble with pointer.
 *
 * @param {{message: string, variant: "error" | "info" | "success", placement: "top" | "bottom", align: "start" | "center" | "end", offset: number}} props
 * @returns {JSX.Element | null}
 */
function TooltipBubble({ message, variant, placement, align, offset }) {
  if (!message) return null;

  const variantStyle = cx.tooltip[variant] || cx.tooltip.info;
  const arrowStyle = cx.tooltipArrow[variant] || cx.tooltipArrow.info;
  const isTop = placement === "top";

  const alignClass =
    align === "center" ? "left-1/2 -translate-x-1/2" : align === "end" ? "right-0" : "left-0";
  const arrowAlignClass =
    align === "center" ? "ml-auto mr-auto" : align === "end" ? "ml-auto mr-4" : "ml-4";
  const positionStyle = isTop ? { bottom: "100%", marginBottom: offset } : { top: "100%", marginTop: offset };

  return (
    <View
      pointerEvents="none"
      style={positionStyle}
      className={`absolute z-50 max-w-[280px] ${alignClass}`}
    >
      {!isTop ? (
        <View className={`${arrowAlignClass} mb-[-5px] h-2.5 w-2.5 rotate-45 border-l border-t ${arrowStyle}`} />
      ) : null}
      <View className={`rounded-lg border px-3 py-2 shadow-lg ${variantStyle}`}>
        <Text className={`font-outfit text-sm leading-snug ${variantStyle}`}>{message}</Text>
      </View>
      {isTop ? (
        <View className={`${arrowAlignClass} -mt-1.5 h-2.5 w-2.5 rotate-45 border-b border-r ${arrowStyle}`} />
      ) : null}
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
  align = "start",
  offset = 8,
  visible,
  children,
  className = ""
}) {
  const [active, setActive] = useState(false);

  if (!message) {
    if (children) return <>{children}</>;
    return null;
  }

  if (!children) {
    return (
      <View className={`relative z-20 h-0 w-full ${className}`}>
        <TooltipBubble
          message={message}
          variant={variant}
          placement={placement}
          align={align}
          offset={offset}
        />
      </View>
    );
  }

  const isVisible = typeof visible === "boolean" ? visible : active;

  return (
    <View className={`relative ${className}`}>
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
      {isVisible ? (
        <TooltipBubble
          message={message}
          variant={variant}
          placement={placement}
          align={align}
          offset={offset}
        />
      ) : null}
    </View>
  );
}
