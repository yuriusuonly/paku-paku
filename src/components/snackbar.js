import { Pressable, Text, View } from "react-native";
import { useNotificationStore } from "../stores/notification-store.js";

/**
 * Snackbar host for transient notifications (e.g. background failures).
 * @module components/snackbar
 */

export function SnackbarHost() {
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismiss);

  if (!items.length) return null;

  const styles = {
    error: "border-[#FE2C55]/30 bg-[#161823] text-white",
    success: "border-emerald-400/30 bg-[#161823] text-white",
    info: "border-[#161823]/20 bg-[#161823] text-white"
  };
  const dot = {
    error: "bg-[#FE2C55]",
    success: "bg-emerald-400",
    info: "bg-[#25F4EE]"
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "fixed", left: 0, right: 0, bottom: 16, zIndex: 50 }}
    >
      <View className="mx-auto w-full max-w-xl px-4 gap-2">
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => dismiss(item.id)}>
            <View className={`flex-row items-center rounded-2xl border px-4 py-3 shadow-lg ${styles[item.variant] || styles.info}`}>
              <View className={`mr-3 h-2.5 w-2.5 rounded-full ${dot[item.variant] || dot.info}`} />
              <Text className="font-outfit flex-1 text-sm leading-relaxed text-white">{item.message}</Text>
              <Text className="font-outfit ml-3 text-xs text-white/60">Dismiss</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
