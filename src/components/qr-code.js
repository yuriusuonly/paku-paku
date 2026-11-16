import { Text, View } from "react-native";
import QRCode from "react-qr-code";
import { cx } from "../shared/constants/theme.js";

/**
 * QR code display component.
 * @module components/qr-code
 */

/**
 * @param {{value?: string | null, label?: string, size?: number}} props
 * @returns {JSX.Element | null}
 */
export function QrCode({ value, label = "QR code", size = 128 }) {
  if (!value) return null;
  return (
    <View className="items-start gap-2">
      <Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>{label}</Text>
      <View className={`rounded-2xl border ${cx.borderSubtle} bg-white p-3`}>
        <QRCode value={String(value)} size={size} />
      </View>
      <Text selectable className={`font-outfit text-xs ${cx.textInk60}`}>{value}</Text>
    </View>
  );
}
