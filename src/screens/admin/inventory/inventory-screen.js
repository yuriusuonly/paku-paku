import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useInventoryStore } from "../../../stores/inventory-store.js";
import { useMenuStore } from "../../../stores/menu-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";
import { InventoryFormSection } from "./inventory-form-component.js";
import { InventoryListSection } from "./inventory-list-component.js";

/**
 * Admin inventory management screen.
 * @module screens/admin/inventory/inventory-screen
 */

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  quantity: "0",
  unit: "",
  reorder_level: "0",
  unit_cost_cents: "0",
  menu_item_id: "",
  is_active: true
};

/**
 * @returns {JSX.Element} Inventory management screen.
 */
export default function AdminInventoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = session?.access_token;
  const isAdmin = status === "authenticated" && user?.role === "admin";

  const items = useInventoryStore((s) => s.items);
  const loading = useInventoryStore((s) => s.loading);
  const syncing = useInventoryStore((s) => s.syncing);
  const storeError = useInventoryStore((s) => s.error);
  const fetchItems = useInventoryStore((s) => s.fetchItems);
  const subscribe = useInventoryStore((s) => s.subscribe);
  const unsubscribe = useInventoryStore((s) => s.unsubscribe);
  const createItem = useInventoryStore((s) => s.createItem);
  const updateItem = useInventoryStore((s) => s.updateItem);

  const menuItems = useMenuStore((s) => s.items);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savingCell, setSavingCell] = useState(null);
  const [localError, setLocalError] = useState("");
  const [formExpanded, setFormExpanded] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchItems(token).catch(() => {});
    void fetchMenuItems(token).catch(() => {});
    subscribe(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchItems, fetchMenuItems, subscribe, unsubscribe]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.is_active).length;
    const lowStock = items.filter((item) => item.is_active && Number(item.quantity || 0) <= Number(item.reorder_level || 0)).length;
    const stockValueCents = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_cost_cents || 0), 0);
    return { total, active, lowStock, stockValueCents };
  }, [items]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const resetForm = () => {
    setForm(emptyForm);
    setLocalError("");
  };

  const saveField = async (item, field, draftValue) => {
    if (!token) return;
    const payload = {};
    if (["name", "sku", "unit", "description", "menu_item_id"].includes(field)) {
      const raw = String(draftValue ?? "").trim();
      const normalized = raw || null;
      const current = item[field] == null ? null : String(item[field]);
      if ((normalized || null) === (current || null)) return;
      if (field === "name" && !normalized) {
        const msg = "Inventory item name is required.";
        showError(msg);
        throw new Error(msg);
      }
      payload[field] = normalized;
    } else if (["quantity", "reorder_level", "unit_cost_cents"].includes(field)) {
      const num = Number(draftValue);
      if (!Number.isInteger(num) || num < 0) {
        const msg = `${field.replace(/_/g, " ")} must be a non-negative whole number.`;
        showError(msg);
        throw new Error(msg);
      }
      if (num === Number(item[field] ?? 0)) return;
      payload[field] = num;
    }
    const cellKey = `${item.id}:${field}`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, payload);
    } catch (e) {
      showError(e?.message || "Could not update inventory item.");
      throw e;
    } finally {
      setSavingCell(null);
    }
  };

  const buildPayload = () => {
    const name = form.name.trim();
    const quantity = Number(form.quantity);
    const reorderLevel = Number(form.reorder_level);
    const unitCost = Number(form.unit_cost_cents);
    if (!name) throw new Error("Inventory item name is required.");
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Quantity must be a non-negative whole number.");
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) throw new Error("Reorder level must be a non-negative whole number.");
    if (!Number.isInteger(unitCost) || unitCost < 0) throw new Error("Unit cost must be a non-negative whole number in cents.");
    return {
      name,
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      quantity,
      unit: form.unit.trim() || null,
      reorder_level: reorderLevel,
      unit_cost_cents: unitCost,
      menu_item_id: form.menu_item_id.trim() || null,
      is_active: Boolean(form.is_active)
    };
  };

  const save = async () => {
    if (!token) return;
    setLocalError("");
    let payload;
    try {
      payload = buildPayload();
    } catch (e) {
      setLocalError(e.message);
      showError(e.message);
      return;
    }
    setSaving(true);
    try {
      await createItem(token, payload);
      showSuccess("Inventory item created.");
      resetForm();
    } catch (e) {
      const message = e?.message || "Could not save the inventory item.";
      setLocalError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const adjustQuantity = async (item, delta) => {
    if (!token) return;
    const cellKey = `${item.id}:quantity`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, { quantity: Math.max(0, Number(item.quantity || 0) + delta) });
    } catch (e) {
      showError(e?.message || "Could not adjust stock.");
    } finally {
      setSavingCell(null);
    }
  };

  const toggleActive = async (item) => {
    if (!token) return;
    const cellKey = `${item.id}:is_active`;
    setSavingCell(cellKey);
    try {
      await updateItem(token, item.id, { is_active: !item.is_active });
    } catch (e) {
      showError(e?.message || "Could not update inventory item.");
    } finally {
      setSavingCell(null);
    }
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text>
        </Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Inventory management</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Track stock levels, costs, reorder thresholds, and menu links in real time.
        </Text>
      </View>

      <Alert variant="error" message={localError || storeError} />

      <View className={`mt-2 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5 mb-6 flex-row flex-wrap gap-x-6 gap-y-3`}>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Items</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Active</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.active}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Low stock</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.lowStock}</Text></View>
        <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Stock value</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.stockValueCents / 100).toFixed(2)}</Text></View>
      </View>

      <InventoryFormSection
        form={form}
        setForm={setForm}
        saving={saving}
        syncing={syncing}
        menuItems={menuItems}
        onSave={save}
        onReset={resetForm}
        expanded={formExpanded}
        onToggleExpanded={() => setFormExpanded((v) => !v)}
      />

      <InventoryListSection
        items={items}
        loading={loading}
        syncing={syncing}
        savingCell={savingCell}
        onSaveField={saveField}
        onAdjust={adjustQuantity}
        onToggleActive={toggleActive}
      />
    </ScreenContainer>
  );
}
