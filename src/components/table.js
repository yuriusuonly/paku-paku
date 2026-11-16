import { ScrollView, Text, View } from "react-native";
import { cx } from "../shared/constants/theme.js";

/**
 * Reusable data table primitives.
 * @module components/table
 */

export function TableScroll({ syncing = false, children }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator className={`${syncing ? "opacity-80" : "opacity-100"}`}>
      {children}
    </ScrollView>
  );
}

export function Table({ minWidth, children }) {
  return (
    <View style={minWidth ? { minWidth } : undefined} className={`min-w-full overflow-hidden rounded-2xl border ${cx.borderSubtle}`}>
      {children}
    </View>
  );
}

export function TableHeader({ children }) {
  return <View className={`flex-row ${cx.bgSurfaceSoft}`}>{children}</View>;
}

export function TableHeaderCell({ width, last = false, children }) {
  return (
    <View style={{ width }} className={`justify-center px-4 py-3 ${!last ? `border-r ${cx.borderSubtle}` : ""}`}>
      {typeof children === "string" ? (
        <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>{children}</Text>
      ) : children}
    </View>
  );
}

export function TableBody({ children }) {
  return <>{children}</>;
}

export function TableRow({ last = false, children }) {
  return <View className={`flex-row ${!last ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}>{children}</View>;
}

export function TableCell({ width, last = false, children, className = "" }) {
  return (
    <View style={{ width }} className={`justify-center px-4 py-3 ${!last ? `border-r ${cx.borderSubtle}` : ""} ${className}`}>
      {children}
    </View>
  );
}
