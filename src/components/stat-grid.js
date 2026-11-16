import { View } from "react-native";
import { StatCard } from "./stat-card.js";

/**
 * Responsive grid of statistic cards.
 * @module components/stat-grid
 */

/**
 * @param {{stats: Array<{label: string, value: any, hint?: string, loading?: boolean}>, className?: string}} props
 * @returns {JSX.Element}
 */
export function StatGrid({ stats, className = "" }) {
  return (
    <View className={`mb-4 flex-row flex-wrap gap-3 ${className}`}>
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          hint={stat.hint}
          loading={stat.loading}
        />
      ))}
    </View>
  );
}
