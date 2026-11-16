import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../components/alert.js";
import { Button } from "../../components/button.js";
import { CircularProgress } from "../../components/circular-progress.js";
import { Header } from "../../components/header.js";
import { ScreenContainer } from "../../components/container.js";
import { TextField } from "../../components/text-field.js";
import { getMyProfile, updateMyProfile } from "../../services/account.js";
import { useAuthStore } from "../../stores/auth-store.js";
import { useNotificationStore } from "../../stores/notification-store.js";
import { cx } from "../../shared/constants/theme.js";

/**
 * Customer account/profile screen.
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

  const [form, setForm] = useState({ full_name: "", phone: "" });
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
    void getMyProfile(token)
      .then((data) => {
        const p = data?.profile || user || {};
        setForm({ full_name: p.full_name || "", phone: p.phone || "" });
      })
      .catch((e) => setError(e?.message || "Could not load your account."))
      .finally(() => setLoading(false));
  }, [hydrated, isCustomer, token, user]);

  if (!hydrated || !isCustomer) return <ScreenContainer><CircularProgress message="Loading account..." /></ScreenContainer>;

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await updateMyProfile(token, form);
      showSuccess("Account updated.");
    } catch (e) {
      const message = e?.message || "Could not update your account.";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>My account</Text>
      <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Manage your customer account details used for orders and counter checkout.</Text>
      <Alert variant="error" message={error} />

      {loading ? <View className="mt-6"><CircularProgress message="Loading account..." /></View> : (
        <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>Email: {user?.email}</Text>
          <TextField label="Full name" value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} placeholder="Your full name" />
          <TextField label="Phone" value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="Contact number" />
          <View className="pt-2"><Button label="Save account" onPress={save} loading={saving} /></View>
        </View>
      )}
    </ScreenContainer>
  );
}
