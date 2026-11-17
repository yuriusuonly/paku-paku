import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { recoverAccount } from "../../services/auth.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Account recovery screen.
 * @module screens/recover/recover-screen
 */

/**
 * Recovery form for resetting password with a one-time recovery code.
 *
 * @returns {JSX.Element} Recover screen.
 */
export default function RecoverScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    setError("");
    setSuccess("");
    const trimmedEmail = email.trim().toLowerCase();
    const code = recoveryCode.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || !code) {
      setError("Enter a valid email and recovery code.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await recoverAccount({ email: trimmedEmail, recovery_code: code, new_password: newPassword });
      setSuccess("Account recovered. You can now sign in with your new password.");
    } catch (e) {
      setError(e?.message || "Could not recover the account. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View className="mx-auto w-full max-w-md">
        <Link href="/signin" asChild>
          <Text className={`font-outfit mb-8 text-sm font-semibold ${cx.textPrimary}`}>
            ← Back to sign in
          </Text>
        </Link>

        <Text className={`${cx.typography.heading} ${cx.textInk}`}>
          Recover account
        </Text>
        <Text className={`font-outfit mt-3 text-base leading-relaxed ${cx.textInk70}`}>
          Use your email and one-time recovery code to set a new password.
        </Text>

        <View className="mt-8 gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            label="Recovery code"
            value={recoveryCode}
            onChangeText={setRecoveryCode}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            autoCapitalize="characters"
          />
          <TextField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
            enablePasswordToggle
            autoComplete="new-password"
          />

          <Alert variant="error" message={error} />
          <Alert variant="success" message={success} />

          {success ? (
            <Button label="Go to sign in" onPress={() => router.replace("/signin")} className="mt-2" />
          ) : (
            <Button label="Recover account" onPress={onSubmit} loading={submitting} className="mt-2" />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
