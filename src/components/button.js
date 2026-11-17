import { ActivityIndicator, Pressable, Text } from "react-native";
import { colors, cx } from "../shared/constants/theme.js";

/**
 * Button component.
 * @module components/button
 */

/**
 * @typedef {object} ButtonProps
 * @property {string} label - Button text.
 * @property {() => void | Promise<void>} [onPress] - Press handler.
 * @property {boolean} [disabled] - Whether the button is disabled.
 * @property {boolean} [loading] - Whether to show a loading indicator.
 * @property {"primary" | "secondary" | "ghost"} [variant] - Visual variant.
 * @property {string} [className] - Additional container classes.
 */

/**
 * Styled pressable button with loading support.
 *
 * @param {ButtonProps} props - Component props.
 * @returns {JSX.Element} Button element.
 */
export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  className = ""
}) {
  const isDisabled = disabled || loading;
  const base = `flex-row items-center justify-center min-h-[44px] px-4 py-3 sm:px-5 ${cx.radius.pill}`;
  const variants = {
    primary: cx.bgPrimary,
    secondary: cx.bgInk,
    ghost: cx.bgSurfaceMuted
  };
  const textVariants = {
    primary: cx.textWhite,
    secondary: cx.textWhite,
    ghost: cx.textInk
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`${base} ${variants[variant]} ${isDisabled ? "opacity-50" : "opacity-100"} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? colors.ink : colors.white} />
      ) : null}
      <Text
        className={`${cx.typography.body} font-semibold ${textVariants[variant]} ${loading ? "ml-2" : ""}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
