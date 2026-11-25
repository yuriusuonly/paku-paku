import { Pressable, Text, View } from "react-native";
import { cx } from "../constants/theme.js";

/**
 * Simple accordion/collapsible section.
 * @module components/accordion
 */

/**
 * @param {object} props
 * @param {string} props.title
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 * @param {import("react").ReactNode} props.children
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
export function AccordionSection({ title, expanded, onToggle, children, className = "" }) {
  return (
    <View className={`${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${className}`}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Hide" : "Show"} ${title}`}
        accessibilityState={{ expanded }}
        className="flex-row min-h-[44px] items-center justify-between py-1"
      >
        <Text className={`${cx.typography.sectionTitle} ${cx.textInk}`}>{title}</Text>
        <Text className={`${cx.typography.label} ${cx.textPrimary}`}>{expanded ? "Hide" : "Show"}</Text>
      </Pressable>
      {expanded ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
