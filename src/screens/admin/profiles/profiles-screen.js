import { useEffect, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useProfilesStore } from "../../../stores/profiles-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin profiles audit and management screen.
 * @module screens/admin/profiles/profiles-screen
 */

const emptyForm = { username: "", password: "" };

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
  { key: "select", label: "", width: 56 },
  { key: "username", label: "Email", width: 220 },
  { key: "role", label: "Role", width: 110 },
  { key: "is_active", label: "Active", width: 110 },
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
  const createUser = useProfilesStore((s) => s.createUser);
  const setProfileActive = useProfilesStore((s) => s.setProfileActive);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [localError, setLocalError] = useState("");

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchProfiles(token).catch(() => {});
    subscribe(token);
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

  const saveUser = async () => {
    if (!token) return;
    setLocalError("");
    const username = form.username.trim().toLowerCase();
    const password = form.password;
    if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(username)) {
      setLocalError("Choose a valid email/username (3-32 chars, lowercase letters, numbers, ., _, -).");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      await createUser(token, { username, password });
      setForm(emptyForm);
      showSuccess("User created.");
    } catch (e) {
      const message = e?.message || "Could not create the user. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
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

  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleSelectedActive = async () => {
    if (!token || selectedIds.length === 0) return;
    setLocalError("");
    setBulkUpdating(true);
    let updatedCount = 0;
    const remaining = [...selectedIds];
    try {
      for (const id of selectedIds) {
        const profile = profiles.find((item) => item.id === id);
        if (!profile) {
          remaining.shift();
          continue;
        }
        if (profile.id === user?.id) {
          remaining.shift();
          continue;
        }
        await setProfileActive(token, profile.id, !profile.is_active);
        updatedCount += 1;
        remaining.shift();
      }
      setSelectedIds(remaining);
      if (updatedCount > 0) {
        showSuccess(`${updatedCount} profile${updatedCount === 1 ? "" : "s"} updated.`);
      } else {
        showError("No selected profiles could be updated.");
      }
    } catch (e) {
      setSelectedIds(remaining);
      const message = e?.message || "Could not update selected profiles. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setBulkUpdating(false);
    }
  };

  const showInitialLoading = loading && profiles.length === 0;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-6">
          <Link href="/admin" asChild>
            <Text className={`font-outfit mb-4 text-sm font-semibold ${cx.textPrimary}`}>
              ← Back to admin
            </Text>
          </Link>
          <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>
            Profiles audit
          </Text>
          <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
            Add users, audit profile fields, and manage active status in real time.
          </Text>
        </View>

        <Alert variant="error" message={localError || error} />

        <View className={`mt-2 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
          <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Add user</Text>
          <Text className={`font-outfit text-sm ${cx.textInk70}`}>
            Create a customer account and profile.
          </Text>
          <TextField
            label="Email"
            value={form.username}
            onChangeText={(v) => setForm((f) => ({ ...f, username: v }))}
            placeholder="customer01"
          />
          <TextField
            label="Password"
            value={form.password}
            onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <View className="flex-row items-center gap-3">
            <Button label="Create user" onPress={saveUser} loading={saving} />
            <Button label="Clear" variant="ghost" onPress={() => setForm(emptyForm)} />
          </View>
        </View>

        <View className="mt-8 mb-3 flex-row items-center justify-between">
          <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Profiles</Text>
          {loading || syncing ? (
            <CircularProgress size="small" />
          ) : (
            <Text className={`font-outfit text-sm ${cx.textInk50}`}>{profiles.length} total</Text>
          )}
        </View>

        <View className="mb-3 flex-row items-center gap-3">
          <Button
            label="Toggle active"
            variant="ghost"
            onPress={toggleSelectedActive}
            loading={bulkUpdating}
            disabled={selectedIds.length === 0 || bulkUpdating}
          />
          {selectedIds.length > 0 ? (
            <Text className={`font-outfit text-sm ${cx.textInk60}`}>{selectedIds.length} selected</Text>
          ) : null}
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
                {(() => {
                  const selectedCount = profiles.filter((profile) => selectedIds.includes(profile.id)).length;
                  const allSelected = profiles.length > 0 && selectedCount === profiles.length;
                  const someSelected = selectedCount > 0 && !allSelected;
                  return columns.map((column, index) => (
                    <View
                      key={column.key}
                      style={{ width: column.width }}
                      className={`justify-center px-4 py-3 ${index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : ""}`}
                    >
                      {column.key === "select" ? (
                        <Pressable
                          onPress={() => setSelectedIds(allSelected ? [] : profiles.map((profile) => profile.id))}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: allSelected ? true : someSelected ? "mixed" : false }}
                          className={`h-5 w-5 items-center justify-center rounded border ${
                            allSelected || someSelected ? `${cx.bgPrimary} ${cx.borderPrimary}` : `${cx.bgSurface} ${cx.borderSubtle}`
                          }`}
                        >
                          {allSelected ? (
                            <Text className={`font-outfit text-xs font-bold ${cx.textWhite}`}>✓</Text>
                          ) : null}
                          {someSelected ? (
                            <View className={`h-0.5 w-2.5 rounded ${cx.bgWhite}`} />
                          ) : null}
                        </Pressable>
                      ) : (
                        <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>
                          {column.label}
                        </Text>
                      )}
                    </View>
                  ));
                })()}
              </View>

              {profiles.map((profile, rowIndex) => {
                const rowKey = String(profile.id ?? `row-${rowIndex}`);
                const isSelf = profile.id === user?.id;
                const isActive = profile.is_active !== false;
                return (
                  <View
                    key={rowKey}
                    className={`flex-row ${rowIndex < profiles.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                  >
                    {columns.map((column, index) => {
                      const rawValue = profile[column.key];
                      let displayValue = rawValue ?? "-";
                      if (column.key === "created_at" || column.key === "updated_at") {
                        displayValue = formatAuditTimestamp(rawValue);
                      } else if (column.key === "is_active") {
                        displayValue = isActive ? "active" : "inactive";
                      }

                      const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                      const isRole = column.key === "role";
                      const isStatus = column.key === "is_active";
                      const isAdminRole = isRole && rawValue === "admin";

                      return (
                        <View
                          key={`${rowKey}-${column.key}`}
                          style={{ width: column.width }}
                          className={`justify-center px-4 py-3 ${cellBorder}`}
                        >
                          {column.key === "select" ? (
                            <Pressable
                              onPress={() => toggleSelected(profile.id)}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: selectedIds.includes(profile.id) }}
                              className={`h-5 w-5 items-center justify-center rounded border ${selectedIds.includes(profile.id) ? `${cx.bgPrimary} ${cx.borderPrimary}` : `${cx.bgSurface} ${cx.borderSubtle}`}`}
                            >
                              {selectedIds.includes(profile.id) ? (
                                <Text className={`font-outfit text-xs font-bold ${cx.textWhite}`}>✓</Text>
                              ) : null}
                            </Pressable>
                          ) : isStatus ? (
                            <Pressable
                              onPress={() => { void toggleActive(profile); }}
                              disabled={updatingId === profile.id || isSelf}
                              className={`self-start rounded-full px-3 py-1 ${isActive ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                            >
                              {updatingId === profile.id ? (
                                <CircularProgress size="small" />
                              ) : (
                                <Text
                                  className={`font-outfit text-xs font-semibold uppercase ${isActive ? cx.textPrimary : cx.textInk70}`}
                                >
                                  {String(displayValue)}
                                </Text>
                              )}
                            </Pressable>
                          ) : isRole ? (
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
                );
              })}
            </View>
          </ScrollView>
        ) : null}
    </ScreenContainer>
  );
}
