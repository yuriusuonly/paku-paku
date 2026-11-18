import { Text, View } from "react-native";
import QRCode from "react-qr-code";
import { cx } from "../shared/constants/theme.js";

/**
 * QR code display component.
 *
 * The raw machine payload is hidden by default so internal identifiers are not
 * shown to customers. Use `caption` for a human-readable reference instead.
 * @module components/qr-code
 */

/**
 * @param {{value?: string | null, label?: string, caption?: string | null, size?: number, showValue?: boolean}} props
 * @returns {JSX.Element | null}
 */
export function QrCode({ value, label = "QR code", caption, size = 128, showValue = false }) {
  if (!value) return null;
  return (
    <View className="items-center gap-2">
      <Text className={`${cx.typography.label} text-center ${cx.textInk60}`}>{label}</Text>
      <View className={`${cx.radius.md} border ${cx.borderSubtle} ${cx.bgWhite} p-3`}>
        <QRCode
          value={String(value)}
          size={size}
          aria-label={caption ? `${label}: ${caption}` : label}
        />
      </View>
      {caption ? (
        <Text selectable className={`text-center font-outfit text-sm font-semibold ${cx.textInk}`}>
          {caption}
        </Text>
      ) : null}
      {showValue ? (
        <Text selectable className={`font-outfit text-xs ${cx.textInk60}`}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}
