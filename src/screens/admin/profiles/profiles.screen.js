import { useEffect, useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useProfilesStore } from "../../../stores/profiles.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { cx } from "../../../shared/constants/theme.js";
import { ProfilesTableSection } from "./profiles-table.component.js";

/**
 * Admin profiles audit screen. Profiles are read-only records.
 * @module screens/admin/profiles/profiles.screen
 */

/**
 * @returns {JSX.Element} Admin profiles screen.
 */
export default function AdminProfilesScreen() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  const profiles = useProfilesStore((s) => s.profiles);
  const loading = useProfilesStore((s) => s.loading);
  const syncing = useProfilesStore((s) => s.syncing);
  const error = useProfilesStore((s) => s.error);
  const fetchProfiles = useProfilesStore((s) => s.fetchProfiles);
  const subscribe = useProfilesStore((s) => s.subscribe);
  const unsubscribe = useProfilesStore((s) => s.unsubscribe);
  const setProfileActive = useProfilesStore((s) => s.setProfileActive);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [updatingId, setUpdatingId] = useState(null);
  const [localError, setLocalError] = useState("");

  const token = session?.access_token;

  useEffect(() => {
    if (!token) return;
    void fetchProfiles(token).catch(() => {});
    subscribe(token);
    return () => {
      void unsubscribe();
    };
  }, [token, fetchProfiles, subscribe, unsubscribe]);

  const stats = {
    total: profiles.length,
    active: profiles.filter((p) => p.is_active !== false).length,
    inactive: profiles.filter((p) => p.is_active === false).length,
    admins: profiles.filter((p) => p.role === "admin").length
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

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text>
        </Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Profiles audit</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Audit staff profile fields and manage active status in real time.
        </Text>
      </View>

      <Alert variant="error" message={localError || error} />

      <StatGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Inactive", value: stats.inactive },
          { label: "Admins", value: stats.admins }
        ]}
      />

      <SectionHeader
        title="Profiles"
        syncing={syncing && profiles.length > 0}
        right={<Text className={`font-outfit text-sm ${cx.textInk50}`}>{profiles.length} total</Text>}
        className="mt-6"
      />

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
