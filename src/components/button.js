import { ActivityIndicator, Pressable, Text } from "react-native";

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
  const base = "flex-row items-center justify-center rounded-full px-5 py-3";
  const variants = {
    primary: "bg-[#FE2C55]",
    secondary: "bg-[#161823]",
    ghost: "bg-[#161823]/5"
  };
  const textVariants = {
    primary: "text-white",
    secondary: "text-white",
    ghost: "text-[#161823]"
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`${base} ${variants[variant]} ${isDisabled ? "opacity-50" : "opacity-100"} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "ghost" ? "#161823" : "#ffffff"} />
      ) : null}
      <Text
        className={`font-outfit text-sm md:text-base font-semibold ${textVariants[variant]} ${loading ? "ml-2" : ""}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
