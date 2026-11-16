import { Text } from "react-native";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { StatusPill } from "../../../components/status-pill.js";
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, TableScroll } from "../../../components/table.js";
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

export function ProfilesTableSection({ profiles, loading, syncing, error, updatingId, currentUserId, onToggleActive }) {
  const showInitialLoading = loading && profiles.length === 0;
  return (
    <>
      {showInitialLoading ? <CircularProgress message="Loading profiles..." /> : null}
      {!loading && !error && profiles.length === 0 ? <EmptyState message="No profiles found." /> : null}
      {profiles.length > 0 ? (
        <TableScroll syncing={syncing}>
          <Table>
            <TableHeader>
              {columns.map((column, index) => (
                <TableHeaderCell key={column.key} width={column.width} last={index === columns.length - 1}>
                  {column.label}
                </TableHeaderCell>
              ))}
            </TableHeader>
            <TableBody>
              {profiles.map((profile, rowIndex) => {
                const rowKey = String(profile.id ?? `row-${rowIndex}`);
                const isSelf = profile.id === currentUserId;
                const isActive = profile.is_active !== false;
                return (
                  <TableRow key={rowKey} last={rowIndex === profiles.length - 1}>
                    {columns.map((column, index) => {
                      const rawValue = profile[column.key];
                      let displayValue = rawValue ?? "-";
                      if (column.key === "created_at" || column.key === "updated_at") displayValue = formatAuditTimestamp(rawValue);
                      else if (column.key === "is_active") displayValue = isActive ? "active" : "inactive";
                      const last = index === columns.length - 1;
                      const isRole = column.key === "role";
                      const isStatus = column.key === "is_active";
                      const isAdminRole = isRole && rawValue === "admin";
                      return (
                        <TableCell key={`${rowKey}-${column.key}`} width={column.width} last={last}>
                          {isStatus ? (
                            <StatusPill
                              label={String(displayValue)}
                              active={isActive}
                              onPress={() => { void onToggleActive(profile); }}
                              disabled={updatingId === profile.id || isSelf}
                              loading={updatingId === profile.id}
                            />
                          ) : isRole ? (
                            <StatusPill label={String(displayValue)} active={isAdminRole} />
                          ) : (
                            <Text selectable className={`font-outfit text-sm ${column.key === "email" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}>
                              {String(displayValue)}
                            </Text>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableScroll>
      ) : null}
    </>
  );
}
