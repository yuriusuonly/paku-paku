import { Pressable, Text } from "react-native";
import { CircularProgress } from "./circular-progress.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Reusable status/badge pill for table cells.
 * @module components/status-pill
 */

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function StatusPill({ label, active = false, onPress, disabled = false, loading = false, tone = "status" }) {
  const isActive = tone === "admin" ? active : active;
  const bg = isActive ? cx.bgPrimarySoft : cx.bgSurfaceMuted;
  const text = isActive ? cx.textPrimary : cx.textInk70;
  const content = (
    loading ? <CircularProgress size="small" /> : (
      <Text className={`font-outfit text-xs font-bold uppercase ${text}`}>{label}</Text>
    )
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        className={`self-start rounded-full px-3 py-1 ${bg}`}
      >
        {content}
      </Pressable>
    );
  }

  return <Text className={`self-start rounded-full px-3 py-1 font-outfit text-xs font-bold uppercase ${bg} ${text}`}>{label}</Text>;
}
