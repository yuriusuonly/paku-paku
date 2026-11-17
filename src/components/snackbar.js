import { Pressable, Text, View } from "react-native";
import { useNotificationStore } from "../stores/notification-store.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Snackbar host for transient notifications (e.g. background failures).
 * @module components/snackbar
 */

/**
 * Host component that renders active transient notifications.
 * @returns {JSX.Element | null} Snackbar host.
 */
export function SnackbarHost() {
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismiss);

  if (!items.length) return null;

  const styles = {
    error: `${cx.borderPrimary30} ${cx.bgSnackbar} ${cx.textWhite}`,
    success: `${cx.borderSuccess30} ${cx.bgSnackbar} ${cx.textWhite}`,
    info: `${cx.borderSoft} ${cx.bgSnackbar} ${cx.textWhite}`
  };
  const dot = {
    error: cx.bgPrimary,
    success: cx.dotSuccess,
    info: cx.dotInfo
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "fixed", left: 0, right: 0, bottom: 16, zIndex: 50 }}
    >
      <View className={`mx-auto w-full max-w-xl px-4 ${cx.spacing.sm}`}>
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => dismiss(item.id)}>
            <View className={`flex-row items-center ${cx.radius.md} border px-4 py-3 shadow-lg ${styles[item.variant] || styles.info}`}>
              <View className={`mr-3 h-2.5 w-2.5 rounded-full ${dot[item.variant] || dot.info}`} />
              <Text className={`${cx.typography.body} flex-1 ${cx.textWhite}`}>{item.message}</Text>
              <Text className={`font-outfit ml-3 text-xs ${cx.textWhite60}`}>Dismiss</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
