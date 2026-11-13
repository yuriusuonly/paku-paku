import { View } from "react-native";

/**
 * Layout container components.
 * @module components/container
 */

/**
 * @typedef {object} ScreenContainerProps
 * @property {import("react").ReactNode} children - Screen content.
 * @property {string} [className] - Additional Tailwind classes.
 */

/**
 * Page-level container with consistent padding and max width.
 *
 * @param {ScreenContainerProps} props - Component props.
 * @returns {JSX.Element} Container view.
 */
export function ScreenContainer({ children, className = "" }) {
  return (
    <View className={`flex-1 bg-white ${className}`}>
      <View className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8 md:py-12">
        {children}
      </View>
    </View>
  );
}
