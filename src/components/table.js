import { ScrollView, Text, View } from "react-native";
import { CircularProgress } from "./circular-progress.js";
import { EmptyState } from "./empty-state.js";
import { cx } from "../shared/constants/theme.js";

/**
 * Reusable data table primitives.
 * @module components/table
 */

/**
 * @param {{syncing?: boolean, children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableScroll({ syncing = false, children }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      className={`${syncing ? "opacity-80" : "opacity-100"}`}
    >
      {children}
    </ScrollView>
  );
}

/**
 * @param {{minWidth?: number, children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function Table({ minWidth, children }) {
  return (
    <View
      style={minWidth ? { minWidth } : undefined}
      className={`min-w-full overflow-hidden rounded-2xl border ${cx.borderSubtle}`}
    >
      {children}
    </View>
  );
}

/**
 * @param {{children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableHeader({ children }) {
  return <View className={`flex-row ${cx.bgSurfaceSoft}`}>{children}</View>;
}

/**
 * @param {{width?: number, last?: boolean, children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableHeaderCell({ width, last = false, children }) {
  return (
    <View
      style={{ width }}
      className={`justify-center px-4 py-3 ${!last ? `border-r ${cx.borderSubtle}` : ""}`}
    >
      {typeof children === "string" ? (
        <Text className={`font-outfit text-xs font-semibold uppercase tracking-wide ${cx.textInk60}`}>
          {children}
        </Text>
      ) : children}
    </View>
  );
}

/**
 * @param {{children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableBody({ children }) {
  return <>{children}</>;
}

/**
 * @param {{last?: boolean, children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableRow({ last = false, children }) {
  return (
    <View className={`flex-row ${!last ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}>
      {children}
    </View>
  );
}

/**
 * @param {{width?: number, last?: boolean, className?: string, children: import("react").ReactNode}} props
 * @returns {JSX.Element}
 */
export function TableCell({ width, last = false, className = "", children }) {
  return (
    <View
      style={{ width }}
      className={`justify-center px-4 py-3 ${!last ? `border-r ${cx.borderSubtle}` : ""} ${className}`}
    >
      {children}
    </View>
  );
}

/**
 * Column descriptor for {@link DataTable}.
 * @typedef {object} TableColumn
 * @property {string} key - Row field key.
 * @property {string} label - Header label.
 * @property {number} [width] - Cell width in pixels.
 */

/**
 * Standard table with loading, empty, and syncing states.
 *
 * @param {object} props
 * @param {TableColumn[]} props.columns - Column descriptors.
 * @param {object[]} props.rows - Row records.
 * @param {boolean} [props.loading] - Whether data is initially loading.
 * @param {boolean} [props.syncing] - Whether a background sync is active.
 * @param {string | null} [props.error] - Error message, when present.
 * @param {string} [props.emptyMessage] - Message shown for an empty table.
 * @param {string} [props.loadingMessage] - Message shown during initial load.
 * @param {(row: object, column: TableColumn, rowIndex: number, columnIndex: number) => import("react").ReactNode} props.renderCell - Cell renderer.
 * @param {(row: object, index: number) => string} [props.getRowKey] - Row key resolver.
 * @returns {JSX.Element}
 */
export function DataTable({
  columns,
  rows,
  loading = false,
  syncing = false,
  error = null,
  emptyMessage = "No records found.",
  loadingMessage = "Loading...",
  renderCell,
  getRowKey = (row, index) => String(row?.id ?? `row-${index}`)
}) {
  const showInitialLoading = loading && rows.length === 0;

  return (
    <>
      {showInitialLoading ? <CircularProgress message={loadingMessage} /> : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : null}

      {rows.length > 0 ? (
        <TableScroll syncing={syncing}>
          <Table>
            <TableHeader>
              {columns.map((column, columnIndex) => (
                <TableHeaderCell
                  key={column.key}
                  width={column.width}
                  last={columnIndex === columns.length - 1}
                >
                  {column.label}
                </TableHeaderCell>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                return (
                  <TableRow key={rowKey} last={rowIndex === rows.length - 1}>
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={`${rowKey}-${column.key}`}
                        width={column.width}
                        last={columnIndex === columns.length - 1}
                      >
                        {renderCell(row, column, rowIndex, columnIndex)}
                      </TableCell>
                    ))}
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
