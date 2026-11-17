import { ActivityIndicator, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Section header with optional syncing indicator.
 * @module components/section-header
 */

/**
 * @param {{visible?: boolean, message?: string}} props
 * @returns {JSX.Element | null}
 */
export function SyncIndicator({ visible = true, message = "Syncing..." }) {
  if (!visible) return null;
  return (
    <View className="flex-row items-center gap-2">
      <ActivityIndicator size="small" />
      <Text className={`${cx.typography.label} ${cx.textInk60}`}>{message}</Text>
    </View>
  );
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function SectionHeader({ title, subtitle, syncing = false, right = null, className = "" }) {
  return (
    <View className={`mb-3 flex-row items-center justify-between gap-3 ${className}`}>
      <View className="flex-1">
        <Text className={`${cx.typography.title} ${cx.textInk}`}>{title}</Text>
        {subtitle ? <Text className={`${cx.typography.caption} ${cx.textInk60}`}>{subtitle}</Text> : null}
      </View>
      <View className="flex-row items-center gap-3">
        {right}
        <SyncIndicator visible={syncing} />
      </View>
    </View>
  );
}
