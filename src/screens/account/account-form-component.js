import { Text, View } from "react-native";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { TextField } from "../../components/text-field.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Account password change form section.
 * @module screens/account/account-form-component
 */

export function AccountFormSection({ email, loading, saving, password, confirmPassword, setPassword, setConfirmPassword, onSave }) {
  if (loading) return <View className="mt-6"><CircularProgress message="Loading account..." /></View>;
  return (
    <View className={`mt-6 ${cx.radius.lg} border ${cx.borderSubtle} ${cx.bgSurface} ${cx.spacing.cardPad} ${cx.spacing.md}`}>
      <Text className={`font-outfit text-sm ${cx.textInk70}`}>Email: {email || "-"}</Text>
      <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Change password</Text>
      <TextField label="New password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry enablePasswordToggle autoComplete="new-password" />
      <TextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" secureTextEntry enablePasswordToggle autoComplete="new-password" />
      <View className="pt-2"><Button label="Change password" onPress={onSave} loading={saving} /></View>
    </View>
  );
}
