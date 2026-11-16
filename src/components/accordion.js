import { Pressable, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

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
    <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 ${className}`}>
      <Pressable onPress={onToggle} className="flex-row items-center justify-between py-1">
        <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>{title}</Text>
        <Text className={`font-outfit text-sm font-semibold ${cx.textPrimary}`}>{expanded ? "Hide" : "Show"}</Text>
      </Pressable>
      {expanded ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}
