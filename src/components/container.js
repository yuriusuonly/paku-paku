import { ScrollView, View } from "react-native";
import { cx } from "../constants/theme.js";

/**
 * Layout container components.
 * @module components/container
 */

/**
 * @typedef {object} ScreenContainerProps
 * @property {import("react").ReactNode} children - Screen content.
 * @property {string} [className] - Additional Tailwind classes.
 * @property {boolean} [scrollable] - Whether content should scroll to screen edges.
 * @property {import("react-native").StyleProp<import("react-native").ViewStyle>} [contentContainerStyle] - Scroll content container style.
 */

/**
 * Page-level container with consistent padding and max width.
 *
 * @param {ScreenContainerProps} props - Component props.
 * @returns {JSX.Element} Container view.
 */
export function ScreenContainer({ children, className = "", scrollable = false, contentContainerStyle }) {
  const content = (
    <View className={`${cx.layout.content} ${cx.spacing.padX} ${cx.spacing.padY}`}>
      {children}
    </View>
  );

  return (
    <View className={`flex-1 ${cx.bgApp} ${className}`}>
      {scrollable ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
