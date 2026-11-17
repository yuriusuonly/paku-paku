import { Text, View } from "react-native";
import { CircularProgress } from "./circular-progress.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Statistic card for dashboard and audit screens.
 * @module components/stat-card
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function StatCard({ label, value, hint, loading = false, className = "" }) {
  return (
    <View className={`w-full min-w-0 sm:w-auto sm:min-w-[150px] sm:flex-1 ${cx.layout.card} ${cx.spacing.cardPad} ${className}`}>
      <Text className={`${cx.typography.label} ${cx.textInk60}`}>{label}</Text>
      {loading ? (
        <View className="py-1"><CircularProgress size="small" /></View>
      ) : (
        <Text className={`${cx.typography.title} ${cx.textInk}`}>{value}</Text>
      )}
      {hint ? <Text className={`${cx.typography.caption} ${cx.textInk60}`}>{hint}</Text> : null}
    </View>
  );
}
