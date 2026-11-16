import { Pressable, ScrollView, Text, View } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin profiles audit table section.
 * @module screens/admin/profiles/profiles-table-component
 */

const columns = [
  { key: "email", label: "Email", width: 220 },
  { key: "role", label: "Role", width: 110 },
  { key: "is_active", label: "Active", width: 110 },
  { key: "id", label: "User ID", width: 320 },
  { key: "created_at", label: "Created at", width: 220 },
  { key: "updated_at", label: "Updated at", width: 220 }
];

function formatAuditTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function ProfilesTableSection({ profiles, loading, syncing, error, updatingId, currentUserId, onToggleActive }) {
  const showInitialLoading = loading && profiles.length === 0;
  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading profiles..." /> : null}
      {!loading && !error && profiles.length === 0 ? <EmptyState message="No profiles found." /> : null}
      {profiles.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator className={`${syncing ? "opacity-80" : "opacity-100"}`}>
          <View className={`min-w-full overflow-hidden rounded-2xl border ${cx.borderSubtle}`}>
            <View className={`flex-row ${cx.bgSurfaceSoft}`}>
              {columns.map((column, index) => (
                <View key={column.key} style={{ width: column.width }} className={`justify-center px-4 py-3 ${index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : ""}`}>
                  <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>{column.label}</Text>
                </View>
              ))}
            </View>

            {profiles.map((profile, rowIndex) => {
              const rowKey = String(profile.id ?? `row-${rowIndex}`);
              const isSelf = profile.id === currentUserId;
              const isActive = profile.is_active !== false;
              return (
                <View key={rowKey} className={`flex-row ${rowIndex < profiles.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}>
                  {columns.map((column, index) => {
                    const rawValue = profile[column.key];
                    let displayValue = rawValue ?? "-";
                    if (column.key === "created_at" || column.key === "updated_at") displayValue = formatAuditTimestamp(rawValue);
                    else if (column.key === "is_active") displayValue = isActive ? "active" : "inactive";
                    const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                    const isRole = column.key === "role";
                    const isStatus = column.key === "is_active";
                    const isAdminRole = isRole && rawValue === "admin";
                    return (
                      <View key={`${rowKey}-${column.key}`} style={{ width: column.width }} className={`justify-center px-4 py-3 ${cellBorder}`}>
                        {isStatus ? (
                          <Pressable onPress={() => { void onToggleActive(profile); }} disabled={updatingId === profile.id || isSelf} className={`self-start rounded-full px-3 py-1 ${isActive ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}>
                            {updatingId === profile.id ? <CircularProgress size="small" /> : <Text className={`font-outfit text-xs font-semibold uppercase ${isActive ? cx.textPrimary : cx.textInk70}`}>{String(displayValue)}</Text>}
                          </Pressable>
                        ) : isRole ? (
                          <View className={`self-start rounded-full px-3 py-1 ${isAdminRole ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}>
                            <Text className={`font-outfit text-xs font-semibold uppercase ${isAdminRole ? cx.textPrimary : cx.textInk70}`}>{String(displayValue)}</Text>
                          </View>
                        ) : (
                          <Text selectable className={`font-outfit text-sm ${column.key === "email" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}>{String(displayValue)}</Text>
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
    </>
  );
}
