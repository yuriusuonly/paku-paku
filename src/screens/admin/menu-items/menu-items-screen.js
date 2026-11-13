import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useMenuStore } from "../../../stores/menu-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin menu items management screen.
 * @module screens/admin/menu-items/menu-items-screen
 */

const emptyForm = { name: "", description: "", price_cents: "", sort_order: "", is_available: true };

const columns = [
  { key: "name", label: "Name", width: 180 },
  { key: "price_cents", label: "Price (cents)", width: 140 },
  { key: "sort_order", label: "Sort", width: 90 },
  { key: "is_available", label: "Available", width: 130 },
  { key: "description", label: "Description", width: 320 },
  { key: "id", label: "Item ID", width: 320 },
  { key: "actions", label: "Actions", width: 140 }
];

/**
 * Inline editable text cell for menu item fields.
 *
 * @param {{value: string | number | null | undefined, onSave: (value: string) => Promise<void> | void, numeric?: boolean, align?: "left" | "right", placeholder?: string}} props
 * @returns {JSX.Element}
 */
function InlineEditableCell({ value, onSave, numeric = false, placeholder = "", multiline = false }) {
  const stringValue = value == null ? "" : String(value);
  const [draft, setDraft] = useState(stringValue);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(stringValue);
  }, [stringValue, focused]);

  const commit = async () => {
    setFocused(false);
    if (draft === stringValue) return;
    try {
      await onSave(draft);
    } catch {
      setDraft(stringValue);
    }
  };

  return (
    <TextInput
      value={draft}
      onChangeText={setDraft}
      onFocus={() => setFocused(true)}
      onBlur={() => { void commit(); }}
      onSubmitEditing={multiline ? undefined : () => { void commit(); }}
      placeholder={placeholder}
      keyboardType={numeric ? "numeric" : "default"}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      className={`font-outfit w-full rounded-lg border ${focused ? cx.borderPrimary30 : "border-transparent"} bg-transparent px-2 py-1 text-sm ${cx.textInk70} ${multiline ? "min-h-[72px]" : ""}`}
    />
  );
}

/**
 * @returns {JSX.Element} Admin menu management screen.
 */
export default function AdminMenuItemsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);

  const items = useMenuStore((s) => s.items);
  const loading = useMenuStore((s) => s.loading);
  const syncing = useMenuStore((s) => s.syncing);
  const error = useMenuStore((s) => s.error);
  const fetchItems = useMenuStore((s) => s.fetchItems);
  const subscribe = useMenuStore((s) => s.subscribe);
  const unsubscribe = useMenuStore((s) => s.unsubscribe);
  const createItem = useMenuStore((s) => s.createItem);
  const updateItem = useMenuStore((s) => s.updateItem);
  const removeItem = useMenuStore((s) => s.removeItem);
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [savingCell, setSavingCell] = useState(null);
  const [localError, setLocalError] = useState("");

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/" : "/sign-in");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchItems(token).catch(() => {});
    subscribe(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchItems, subscribe, unsubscribe]);

  const sorted = useMemo(() => items, [items]);
  const showInitialLoading = loading && items.length === 0;

  const resetForm = () => {
    setForm(emptyForm);
    setLocalError("");
  };

  const save = async () => {
    if (!token) return;
    setLocalError("");
    const name = form.name.trim();
    const price = Number(form.price_cents);
    const sortOrderRaw = form.sort_order.trim();
    const hasSortOrder = sortOrderRaw !== "";
    const sortOrder = hasSortOrder ? Number(sortOrderRaw) : undefined;
    if (!name || !Number.isInteger(price) || price < 0 || (hasSortOrder && !Number.isInteger(sortOrder))) {
      setLocalError("Please provide a valid name, a non-negative whole-number price in cents, and an optional whole-number sort order.");
      return;
    }
    const payload = {
      name,
      description: form.description.trim() || null,
      price_cents: price,
      is_available: Boolean(form.is_available),
      ...(hasSortOrder ? { sort_order: sortOrder } : {})
    };
    setSaving(true);
    try {
      await createItem(token, payload);
      showSuccess("Menu item created.");
      setForm(emptyForm);
    } catch (e) {
      const message = e?.message || "Could not save the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const saveField = async (item, field, draftValue) => {
    if (!token) return;
    setLocalError("");
    const payload = {};
    if (field === "name") {
      const name = String(draftValue ?? "").trim();
      if (!name) {
        const msg = "Menu item name is required.";
        setLocalError(msg);
        showError(msg);
        throw new Error(msg);
      }
      if (name === item.name) return;
      payload.name = name;
    } else if (field === "description") {
      const description = String(draftValue ?? "").trim();
      const normalized = description || null;
      if ((item.description || null) === normalized) return;
      payload.description = normalized;
    } else if (field === "price_cents") {
      const price = Number(draftValue);
      if (!Number.isInteger(price) || price < 0) {
        const msg = "Price must be a non-negative whole number in cents.";
        setLocalError(msg);
        showError(msg);
        throw new Error(msg);
      }
      if (price === item.price_cents) return;
      payload.price_cents = price;
    } else if (field === "sort_order") {
      const sortOrder = Number(draftValue);
      if (!Number.isInteger(sortOrder)) {
        const msg = "Sort order must be a whole number.";
        setLocalError(msg);
        showError(msg);
        throw new Error(msg);
      }
      if (sortOrder === item.sort_order) return;
      payload.sort_order = sortOrder;
    }

    const cellKey = `${item.id}:${field}`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, payload);
      showSuccess("Menu item updated.");
    } catch (e) {
      const message = e?.message || "Could not update the menu item. Please try again.";
      setLocalError(message);
      showError(message);
      throw e;
    } finally {
      setSavingCell(null);
    }
  };

  const toggleAvailable = async (item) => {
    if (!token) return;
    setLocalError("");
    const cellKey = `${item.id}:is_available`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, { is_available: !item.is_available });
      showSuccess(item.is_available ? "Menu item hidden." : "Menu item made available.");
    } catch (e) {
      const message = e?.message || "Could not update the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSavingCell(null);
    }
  };

  const remove = async (id) => {
    if (!token) return;
    setLocalError("");
    setDeletingId(id);
    try {
      await removeItem(token, id);
      showSuccess("Menu item deleted.");
    } catch (e) {
      const message = e?.message || "Could not delete the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Header />
        <View className="mb-6 flex-row items-end justify-between">
          <View>
            <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Menu items management</Text>
            <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Edit table fields directly. Changes sync in real time across open screens and devices.</Text>
          </View>
          <Link href="/admin" asChild><Button label="Back" variant="ghost" /></Link>
        </View>

        <Alert variant="error" message={localError || error} />

        <View className={`mt-4 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 gap-3`}>
          <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>New item</Text>
          <TextField label="Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Takoyaki" />
          <TextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Description" multiline numberOfLines={4} />
          <TextField label="Price (cents)" value={form.price_cents} onChangeText={(v) => setForm((f) => ({ ...f, price_cents: v }))} placeholder="650" keyboardType="numeric" />
          <TextField label="Sort order (optional)" value={form.sort_order} onChangeText={(v) => setForm((f) => ({ ...f, sort_order: v }))} placeholder="Auto" keyboardType="numeric" />
          <View className="flex-row items-center gap-3">
            <Button label={form.is_available ? "Available" : "Unavailable"} variant="ghost" onPress={() => setForm((f) => ({ ...f, is_available: !f.is_available }))} />
            <Button label="Create item" onPress={save} loading={saving} />
            <Button label="Clear" variant="ghost" onPress={resetForm} />
          </View>
        </View>

        <View className="mt-8 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className={`font-outfit text-xl font-bold ${cx.textInk}`}>Menu items</Text>
            {syncing ? <CircularProgress size="small" /> : null}
          </View>
          <Text className={`font-outfit text-sm ${cx.textInk50}`}>
            {loading ? "Loading..." : syncing ? "Syncing changes..." : `${sorted.length} total`}
          </Text>
        </View>

        {showInitialLoading ? <CircularProgress message="Loading menu items..." /> : null}

        {!loading && !error && sorted.length === 0 ? (
          <Alert variant="info" message="No menu items yet. Create one above to get started." />
        ) : null}

        {sorted.length > 0 ? (
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

              {sorted.map((item, rowIndex) => {
                const rowKey = String(item.id ?? `row-${rowIndex}`);
                return (
                  <View
                    key={rowKey}
                    className={`flex-row ${rowIndex < sorted.length - 1 ? `border-b ${cx.borderSubtle}` : ""} ${cx.bgSurface}`}
                  >
                    {columns.map((column, index) => {
                      const rawValue = item[column.key];
                      const cellBorder = index < columns.length - 1 ? `border-r ${cx.borderSubtle}` : "";
                      const isEditable = ["name", "description", "price_cents", "sort_order"].includes(column.key);
                      const isStatus = column.key === "is_available";

                      return (
                        <View
                          key={`${rowKey}-${column.key}`}
                          style={{ width: column.width }}
                          className={`justify-center px-4 py-3 ${cellBorder}`}
                        >
                          {column.key === "actions" ? (
                            <View className="flex-row flex-wrap gap-2">
                              <Button
                                label="Delete"
                                variant="ghost"
                                onPress={() => remove(item.id)}
                                loading={deletingId === item.id}
                                disabled={deletingId === item.id}
                              />
                            </View>
                          ) : isStatus ? (
                            <Pressable
                              onPress={() => { void toggleAvailable(item); }}
                              disabled={savingCell === `${item.id}:is_available`}
                              className={`self-start rounded-full px-3 py-1 ${rawValue ? cx.bgPrimarySoft : cx.bgSurfaceMuted}`}
                            >
                              <Text
                                className={`font-outfit text-xs font-semibold uppercase ${rawValue ? cx.textPrimary : cx.textInk70}`}
                              >
                                {rawValue ? "available" : "hidden"}
                              </Text>
                            </Pressable>
                          ) : isEditable ? (
                            <InlineEditableCell
                              value={rawValue ?? (column.key === "description" ? "" : rawValue)}
                              onSave={(draft) => saveField(item, column.key, draft)}
                              numeric={column.key === "price_cents" || column.key === "sort_order"}
                              multiline={column.key === "description"}
                              placeholder={column.key === "description" ? "Add description" : ""}
                            />
                          ) : (
                            <Text
                              selectable
                              className={`font-outfit text-sm ${column.key === "name" ? `font-semibold ${cx.textInk}` : cx.textInk70}`}
                            >
                              {String(rawValue ?? "-")}
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
      </ScrollView>
    </ScreenContainer>
  );
}
