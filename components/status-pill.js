import { Pressable, Text } from "react-native";
import { CircularProgress } from "./circular-progress.js";
import { cx } from "../constants/theme.js";

/**
 * Reusable status/badge pill for table cells.
 * @module components/status-pill
 */

/**
 * @type {Record<string, {container: string, text: string}>}
 */
const variants = {
  success: { container: cx.bgPrimarySoft, text: cx.textPrimary },
  neutral: { container: cx.bgSurfaceMuted, text: cx.textInk70 },
  danger: { container: cx.bgPrimarySoft, text: cx.textError },
  warning: { container: "bg-amber-100", text: "text-amber-800" },
  info: { container: cx.bgSurfaceSoft, text: cx.textInk80 }
};

/**
 * Resolves the visual variant, keeping the older boolean API working.
 *
 * @param {{variant?: string, active?: boolean}} props
 * @returns {{container: string, text: string}}
 */
function resolveVariant({ variant, active }) {
  if (variant && variants[variant]) return variants[variant];
  return active ? variants.success : variants.neutral;
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function StatusPill({
  label,
  variant,
  active,
  onPress,
  disabled = false,
  loading = false,
  className = ""
}) {
  const style = resolveVariant({ variant, active });
  const accessibilityLabel = typeof label === "string" ? label : undefined;
  const content = loading ? (
    <CircularProgress size="small" />
  ) : (
    <Text className={`font-outfit text-xs font-bold uppercase ${style.text}`}>{label}</Text>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        className={`self-start rounded-full px-3 py-1 ${style.container} ${className}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      className={`self-start rounded-full px-3 py-1 font-outfit text-xs font-bold uppercase ${style.container} ${style.text} ${className}`}
    >
      {label}
    </Text>
  );
}
