import { Text } from "react-native";
import { StatusPill } from "../../../components/status-pill.js";
import { DataTable } from "../../../components/table.js";
import { formatAuditTimestamp } from "../../../shared/format/date.js";
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

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
export function ProfilesTableSection({
  profiles,
  loading,
  syncing,
  error,
  updatingId,
  currentUserId,
  onToggleActive
}) {
  return (
    <DataTable
      columns={columns}
      rows={profiles}
      loading={loading && profiles.length === 0}
      syncing={syncing}
      error={error}
      loadingMessage="Loading profiles..."
      emptyMessage="No profiles found."
      renderCell={(profile, column) => {
        const key = column.key;
        const rawValue = profile[key];

        if (key === "is_active") {
          const isActive = rawValue !== false;
          return (
            <StatusPill
              label={isActive ? "active" : "inactive"}
              variant={isActive ? "success" : "neutral"}
              onPress={() => { void onToggleActive(profile); }}
              disabled={updatingId === profile.id || profile.id === currentUserId}
              loading={updatingId === profile.id}
            />
          );
        }

        if (key === "role") {
          return (
            <StatusPill
              label={String(rawValue ?? "-")}
              variant={rawValue === "admin" ? "success" : "neutral"}
            />
          );
        }

        const displayValue = key === "created_at" || key === "updated_at"
          ? formatAuditTimestamp(rawValue)
          : String(rawValue ?? "-");

        return (
          <Text
            selectable
            className={`font-outfit text-sm ${key === "email" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}
          >
            {displayValue}
          </Text>
        );
      }}
    />
  );
}
