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
    <View className={`min-w-[150px] flex-1 rounded-2xl border ${cx.borderSubtle} ${cx.bgSurface} p-4 ${className}`}>
      <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{label}</Text>
      {loading ? (
        <View className="py-1"><CircularProgress size="small" /></View>
      ) : (
        <Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{value}</Text>
      )}
      {hint ? <Text className={`font-outfit text-xs ${cx.textInk60}`}>{hint}</Text> : null}
    </View>
  );
}
