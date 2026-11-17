import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
// Button import removed (no bulk actions)
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { SectionHeader } from "../../../components/section-header.js";
import { StatGrid } from "../../../components/stat-grid.js";
import { useAuthStore } from "../../../stores/auth.store.js";
import { useMenuStore } from "../../../stores/menu.store.js";
import { useNotificationStore } from "../../../stores/notification.store.js";
import { cx } from "../../../shared/constants/theme.js";
import { menuItemCreateSchema } from "../../../domain/menu-items/schema.js";
import { MenuItemFormSection } from "./menu-item-form.component.js";
import { MenuItemsTableSection } from "./menu-items-table.component.js";

/**
 * Admin menu items management screen.
 * @module screens/admin/menu-items/menu-items.screen
 */

const emptyForm = { name: "", description: "", price_cents: "", sort_order: "", is_available: true, is_best_seller: false };

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
  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ name: false, description: false, price_cents: false, sort_order: false });
  const [formExpanded, setFormExpanded] = useState(false);

  const isAdmin = status === "authenticated" && user?.role === "admin";
  const token = session?.access_token;

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchItems(token).catch(() => {});
    subscribe(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchItems, subscribe, unsubscribe]);

  const sorted = useMemo(() => items, [items]);
  const stats = useMemo(() => ({
    total: sorted.length,
    available: sorted.filter((item) => item.is_available).length,
    unavailable: sorted.filter((item) => !item.is_available).length,
    bestSellers: sorted.filter((item) => item.is_best_seller).length
  }), [sorted]);

  const resetForm = () => {
    setForm(emptyForm);
    setLocalError("");
    setFieldErrors({ name: false, description: false, price_cents: false, sort_order: false });
  };

  const save = async () => {
    if (!token) return;
    setLocalError("");
    const sortOrderRaw = form.sort_order.trim();
    const parsed = menuItemCreateSchema.safeParse({
      name: form.name.trim(),
      description: form.description.trim(),
      price_cents: form.price_cents.trim(),
      is_available: Boolean(form.is_available),
      is_best_seller: Boolean(form.is_best_seller),
      ...(sortOrderRaw !== "" ? { sort_order: sortOrderRaw } : {})
    });

    if (!parsed.success) {
      const invalidFields = new Set(parsed.error.issues.map((issue) => String(issue.path[0])));
      setFieldErrors({
        name: invalidFields.has("name"),
        description: invalidFields.has("description"),
        price_cents: invalidFields.has("price_cents"),
        sort_order: invalidFields.has("sort_order")
      });
      const firstField = String(parsed.error.issues[0]?.path[0] || "");
      const messages = {
        name: "Menu item name is required.",
        price_cents: "Price must be a non-negative whole number in cents.",
        sort_order: "Sort order must be a whole number."
      };
      setLocalError(messages[firstField] || "Please provide valid menu item fields.");
      return;
    }

    setFieldErrors({ name: false, description: false, price_cents: false, sort_order: false });
    const payload = parsed.data;
    setSaving(true);
    try {
      await createItem(token, payload);
      showSuccess("Menu item created.");
      setForm(emptyForm);
      setFieldErrors({ name: false, description: false, price_cents: false, sort_order: false });
    } catch (e) {
      const message = e?.message || "Could not save the menu item. Please try again.";
      setLocalError(message);
      setFieldErrors({ name: true, price_cents: true, sort_order: false, description: false });
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
      showSuccess(item.is_available ? "Menu item made unavailable." : "Menu item made available.");
    } catch (e) {
      const message = e?.message || "Could not update the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSavingCell(null);
    }
  };

  const toggleBestSeller = async (item) => {
    if (!token) return;
    setLocalError("");
    const cellKey = `${item.id}:is_best_seller`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, { is_best_seller: !item.is_best_seller });
      showSuccess(item.is_best_seller ? "Removed best seller label." : "Marked as best seller.");
    } catch (e) {
      const message = e?.message || "Could not update the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSavingCell(null);
    }
  };

  // Per-row audit actions are handled inline in the table.

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>
            ← Back to admin
          </Text>
        </Link>
        <Text className={`${cx.typography.heading} ${cx.textInk}`}>Menu items management</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>Edit table fields directly. Changes sync in real time across open screens and devices.</Text>
      </View>

      <Alert variant="error" message={localError || error} />

      <StatGrid
        stats={[
          { label: "Total", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "Unavailable", value: stats.unavailable },
          { label: "Best sellers", value: stats.bestSellers }
        ]}
      />

      <MenuItemFormSection
        form={form}
        setForm={setForm}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        saving={saving}
        onSave={save}
        onReset={resetForm}
        expanded={formExpanded}
        onToggleExpanded={() => setFormExpanded((v) => !v)}
      />

      <SectionHeader
        title="Menu items"
        syncing={syncing && sorted.length > 0}
        right={<Text className={`font-outfit text-sm ${cx.textInk50}`}>{sorted.length} total</Text>}
        className="mt-6"
      />

      <MenuItemsTableSection
        items={items}
        sorted={sorted}
        loading={loading}
        syncing={syncing}
        error={error}
        savingCell={savingCell}
        onSaveField={saveField}
        onToggleAvailable={toggleAvailable}
        onToggleBestSeller={toggleBestSeller}
      />
    </ScreenContainer>
  );
}
