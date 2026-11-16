import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
// Button import removed (no bulk actions)
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useProfilesStore } from "../../../stores/profiles-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";
import { ProfilesFormSection } from "./profiles-form-component.js";
import { ProfilesTableSection } from "./profiles-table-component.js";

/**
 * Admin profiles audit and management screen.
 * @module screens/admin/profiles/profiles-screen
 */

const emptyForm = { email: "", password: "" };

/**
 * @returns {JSX.Element} Admin profiles screen.
 */
export default function AdminProfilesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const profiles = useProfilesStore((s) => s.profiles);
  const loading = useProfilesStore((s) => s.loading);
  const syncing = useProfilesStore((s) => s.syncing);
  const error = useProfilesStore((s) => s.error);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribe = useProfilesStore((s) => s.subscribe);
  const unsubscribe = useProfilesStore((s) => s.unsubscribe);
  const createUser = useProfilesStore((s) => s.createUser);
  const setProfileActive = useProfilesStore((s) => s.setProfileActive);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });
  const [createdRecoveryCode, setCreatedRecoveryCode] = useState("");
  const [formExpanded, setFormExpanded] = useState(false);

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchProfiles(token).catch(() => {});
    subscribe(token);
    return () => {
      void unsubscribe();
    };
  }, [hydrated, isAdmin, token, fetchProfiles, subscribe, unsubscribe]);

  const stats = {
    total: profiles.length,
    active: profiles.filter((p) => p.is_active !== false).length,
    inactive: profiles.filter((p) => p.is_active === false).length,
    admins: profiles.filter((p) => p.role === "admin").length
  };

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const saveUser = async () => {
    if (!token) return;
    setLocalError("");
    setCreatedRecoveryCode("");
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordError = password.length < 6;
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      setLocalError(emailError ? "Enter a valid email address." : "Password must be at least 6 characters.");
      return;
    }
    setFieldErrors({ email: false, password: false });
    setSaving(true);
    try {
      const data = await createUser(token, { email, password });
      setForm(emptyForm);
      setFieldErrors({ email: false, password: false });
      setCreatedRecoveryCode(data?.recovery_code || "");
      showSuccess("User created.");
    } catch (e) {
      const message = e?.message || "Could not create the user. Please try again.";
      setLocalError(message);
      setFieldErrors({ email: true, password: true });
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const copyCreatedRecoveryCode = async () => {
    if (!createdRecoveryCode) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(createdRecoveryCode);
        showSuccess("Recovery code copied.");
        return;
      }
    } catch {}
    showError("Could not copy the recovery code. Please copy it manually.");
  };

  const toggleActive = async (profile) => {
    if (!token) return;
    if (profile.id === user?.id) {
      const message = "You cannot deactivate your own account.";
      setLocalError(message);
      showError(message);
      return;
    }
    setLocalError("");
    setUpdatingId(profile.id);
    try {
      await setProfileActive(token, profile.id, !profile.is_active);
      showSuccess(profile.is_active ? "Profile deactivated." : "Profile activated.");
    } catch (e) {
      const message = e?.message || "Could not update the profile. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Per-row audit actions are handled inline in the table.

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text>
        </Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Profiles audit</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Add users, audit profile fields, and manage active status in real time.
        </Text>
      </View>

      <Alert variant="error" message={localError || error} />

      <View className={`rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Total</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Active</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.active}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Inactive</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.inactive}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Admins</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.admins}</Text></View>
      </View>

      <ProfilesFormSection
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        saving={saving}
        createdRecoveryCode={createdRecoveryCode}
        onSave={saveUser}
        onClear={() => { setForm(emptyForm); setFieldErrors({ email: false, password: false }); setLocalError(""); setCreatedRecoveryCode(""); }}
        onCopyRecoveryCode={copyCreatedRecoveryCode}
        expanded={formExpanded}
        onToggleExpanded={() => setFormExpanded((v) => !v)}
      />

      <View className="mt-6 mb-3 flex-row items-center justify-between">
        <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Profiles</Text>
        <View className="flex-row items-center gap-2">
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>{profiles.length} total</Text>
          {syncing && profiles.length > 0 ? <CircularProgress size="small" /> : null}
        </View>
      </View>

      <ProfilesTableSection
        profiles={profiles}
        loading={loading}
        syncing={syncing}
        error={error}
        updatingId={updatingId}
        currentUserId={user?.id}
        onToggleActive={toggleActive}
      />
    </ScreenContainer>
  );
}
