import { useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useProfilesStore } from "../../../stores/profiles-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin profiles audit screen.
 * @module screens/admin/profiles/profiles-screen
 */

/**
 * Formats an ISO timestamp for display.
 *
 * @param {string | null | undefined} value - Timestamp value.
 * @returns {string} Formatted timestamp or placeholder.
 */
function formatAuditTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

const columns = [
  { key: "username", label: "Username", width: 160 },
  { key: "role", label: "Role", width: 110 },
  { key: "id", label: "User ID", width: 320 },
  { key: "created_at", label: "Created at", width: 220 },
  { key: "updated_at", label: "Updated at", width: 220 }
];

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

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchProfiles(token).catch(() => {});
    subscribe();
    return () => {
      void unsubscribe();
    };
  }, [hydrated, isAdmin, token, fetchProfiles, subscribe, unsubscribe]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const showInitialLoading = loading && profiles.length === 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-6 flex-row items-end justify-between">
          <View className="flex-1 pr-4">
            <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>
              Profiles audit
            </Text>
            <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
              Audit profile fields in real time. Changes sync automatically.
            </Text>
          </View>
          <Link href="/admin" asChild>
            <Button label="Back" variant="ghost" />
          </Link>
        </View>

        <Alert variant="error" message={error} />

        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Profiles</Text>
            {syncing ? <CircularProgress size="small" /> : null}
          </View>
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>
            {loading ? "Loading..." : syncing ? "Syncing changes..." : `${profiles.length} total`}
          </Text>
        </View>

        {showInitialLoading ? <CircularProgress message="Loading profiles..." /> : null}

        {!loading && !error && profiles.length === 0 ? (
          <Alert variant="info" message="No profiles found." />
        ) : null}

        {profiles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            className={`${syncing ? "opacity-80" : "opacity-100"}`}
          >
            <View className={`min-w-full overflow-hidden rounded-2xl border ${cx.borderSubtle}`}>
              <View className={`flex-row ${cx.bgSurfaceSoft}`}>
                {columns.map((column, index) => (
                  <View
                    key={column.key}
                    style={{ width: column.width }}
                    className={`px-4 py-3 ${index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : ""}`}
                  >
                    <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>
                      {column.label}
                    </Text>
                  </View>
                ))}
              </View>

              {profiles.map((profile, rowIndex) => (
                <View
                  key={profile.id}
                  className={`flex-row ${rowIndex < profiles.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                >
                  {columns.map((column, index) => {
                    const rawValue = profile[column.key];
                    const displayValue =
                      column.key === "created_at" || column.key === "updated_at"
                        ? formatAuditTimestamp(rawValue)
                        : rawValue ?? "-";

                    const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                    const isRole = column.key === "role";
                    const isAdminRole = isRole && rawValue === "admin";

                    return (
                      <View
                        key={`${profile.id}-${column.key}`}
                        style={{ width: column.width }}
                        className={`justify-center px-4 py-3 ${cellBorder}`}
                      >
                        {isRole ? (
                          <View
                            className={`self-start rounded-full px-3 py-1 ${isAdminRole ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                          >
                            <Text
                              className={`font-outfit text-xs font-semibold uppercase ${isAdminRole ? cx.textPrimary : cx.textInk70}`}
                            >
                              {String(displayValue)}
                            </Text>
                          </View>
                        ) : (
                          <Text
                            selectable
                            className={`font-outfit text-sm ${column.key === "username" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}
                          >
                            {String(displayValue)}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
