import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { getMyAccount, changeMyPassword } from "../../services/account.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer account screen.
 * @module screens/account/account-screen
 */

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const status = useAuthStore((s) => s.status);
  const token = session?.access_token;
  const isCustomer = status === "authenticated" && user && user.role !== "admin";
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!isCustomer) router.replace(status === "authenticated" ? "/admin" : "/signin");
  }, [hydrated, isCustomer, status, router]);

  useEffect(() => {
    if (!hydrated || !isCustomer || !token) return;
    setLoading(true);
    void getMyAccount(token)
      .then((data) => setEmail(data?.profile?.email || user?.email || ""))
      .catch((e) => setError(e?.message || "Could not load your account."))
      .finally(() => setLoading(false));
  }, [hydrated, isCustomer, token, user?.email]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading account..." /></ScreenContainer>;

  const save = async () => {
    if (!token) return;
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changeMyPassword(token, password);
      setPassword("");
      setConfirmPassword("");
      showSuccess("Password changed.");
    } catch (e) {
      const message = e?.message || "Could not change your password.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Account</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage your account sign-in details.</Text>
      <Alert variant="error" message={error} />

      {loading ? <View className="mt-6"><CircularProgress message="Loading account..." /></View> : (
        <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Email: {email || "-"}</Text>
          <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Change password</Text>
          <TextField label="New password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry enablePasswordToggle autoComplete="new-password" />
          <TextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" secureTextEntry enablePasswordToggle autoComplete="new-password" />
          <View className="pt-2"><Button label="Change password" onPress={save} loading={saving} /></View>
        </View>
      )}
    </ScreenContainer>
  );
}
