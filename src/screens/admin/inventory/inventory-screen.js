import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { EmptyState } from "../../../components/empty-state.js";
import { Header } from "../../../components/header.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useInventoryStore } from "../../../stores/inventory-store.js";
import { useMenuStore } from "../../../stores/menu-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";
import { cx } from "../../../shared/constants/theme.js";

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
  const removeItem = useInventoryStore((s) => s.removeItem);

  const menuItems = useMenuStore((s) => s.items);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [localError, setLocalError] = useState("");

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
    setEditingId(null);
    setLocalError("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      sku: item.sku || "",
      description: item.description || "",
      quantity: String(item.quantity ?? 0),
      unit: item.unit || "",
      reorder_level: String(item.reorder_level ?? 0),
      unit_cost_cents: String(item.unit_cost_cents ?? 0),
      menu_item_id: item.menu_item_id || "",
      is_active: Boolean(item.is_active)
    });
    setLocalError("");
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
      if (editingId) {
        await updateItem(token, editingId, payload);
        showSuccess("Inventory item updated.");
      } else {
        await createItem(token, payload);
        showSuccess("Inventory item created.");
      }
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
    setBusyId(item.id);
    try {
      await updateItem(token, item.id, { quantity: Math.max(0, Number(item.quantity || 0) + delta) });
      showSuccess(delta > 0 ? "Stock increased." : "Stock decreased.");
    } catch (e) {
      showError(e?.message || "Could not adjust stock.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item) => {
    if (!token) return;
    setBusyId(item.id);
    try {
      await removeItem(token, item.id);
      if (editingId === item.id) resetForm();
      showSuccess("Inventory item deleted.");
    } catch (e) {
      showError(e?.message || "Could not delete the inventory item.");
    } finally {
      setBusyId(null);
    }
  };

  const showInitialLoading = loading && items.length === 0;

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

      <View className={`mt-2 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
        <View className="mb-4 flex-row flex-wrap gap-x-6 gap-y-3">
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Items</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.total}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Active</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.active}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Low stock</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{stats.lowStock}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Stock value</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(stats.stockValueCents / 100).toFixed(2)}</Text></View>
        </View>

        <Text className={`font-outfit mb-3 text-lg font-bold ${cx.textInk}`}>{editingId ? "Edit inventory item" : "Add inventory item"}</Text>
        <View className="gap-3">
          <TextField label="Name (*)" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Chicken breast" />
          <TextField label="SKU" value={form.sku} onChangeText={(v) => setForm((f) => ({ ...f, sku: v }))} placeholder="Optional SKU" />
          <TextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Optional description" multiline numberOfLines={3} />
          <TextField label="Quantity (*)" value={form.quantity} onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))} placeholder="0" keyboardType="numeric" />
          <TextField label="Unit" value={form.unit} onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))} placeholder="e.g. pcs, kg" />
          <TextField label="Reorder level" value={form.reorder_level} onChangeText={(v) => setForm((f) => ({ ...f, reorder_level: v }))} placeholder="0" keyboardType="numeric" />
          <TextField label="Unit cost (cents)" value={form.unit_cost_cents} onChangeText={(v) => setForm((f) => ({ ...f, unit_cost_cents: v }))} placeholder="0" keyboardType="numeric" />
          <TextField label="Linked menu item ID" value={form.menu_item_id} onChangeText={(v) => setForm((f) => ({ ...f, menu_item_id: v }))} placeholder="Optional menu_items.id" />
          <View className="flex-row items-center gap-3">
            <Button label={form.is_active ? "Active" : "Inactive"} variant={form.is_active ? "secondary" : "ghost"} onPress={() => setForm((f) => ({ ...f, is_active: !f.is_active }))} />
            <Text className={`font-outfit text-sm ${cx.textInk70}`}>Toggle stock record availability</Text>
          </View>
          {menuItems.length > 0 ? (
            <Text className={`font-outfit text-xs ${cx.textInk60}`}>Tip: copy a menu item ID from Menu Items audit to link stock to a menu item.</Text>
          ) : null}
          <View className="flex-row flex-wrap items-center gap-3 pt-1">
            <Button label={editingId ? "Update item" : "Create item"} onPress={save} loading={saving} disabled={syncing && !saving} />
            <Button label="Clear" variant="ghost" onPress={resetForm} disabled={saving} />
          </View>
        </View>
      </View>

      <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Inventory records</Text>
          {syncing ? <Text className={`font-outfit text-xs ${cx.textInk60}`}>Syncing...</Text> : null}
        </View>

        {showInitialLoading ? (
          <CircularProgress message="Loading inventory..." />
        ) : items.length === 0 ? (
          <EmptyState message="No inventory items yet. Add your first stock record above." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View className="min-w-full gap-3">
              {items.map((item) => {
                const low = item.is_active && Number(item.quantity || 0) <= Number(item.reorder_level || 0);
                return (
                  <View key={item.id} className={`rounded-2xl border ${low ? cx.borderPrimary30 : cx.borderSubtle} ${cx.bgSurfaceSoft} p-4`}>
                    <View className="flex-row flex-wrap items-start justify-between gap-3">
                      <View className="flex-1 min-w-[220px]">
                        <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>{item.name}</Text>
                        <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                          SKU: {item.sku || "-"} · Unit: {item.unit || "-"} · Qty: {item.quantity} · Reorder: {item.reorder_level}
                        </Text>
                        <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                          Unit cost: ₱{(Number(item.unit_cost_cents || 0) / 100).toFixed(2)} · Value: ₱{((Number(item.quantity || 0) * Number(item.unit_cost_cents || 0)) / 100).toFixed(2)}
                        </Text>
                        <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>
                          Menu item: {item.menu_item_id || "-"} · {item.is_active ? "Active" : "Inactive"}{low ? " · Low stock" : ""}
                        </Text>
                        {item.description ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{item.description}</Text> : null}
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        <Button label="-1" variant="ghost" onPress={() => adjustQuantity(item, -1)} loading={busyId === item.id} disabled={busyId === item.id} />
                        <Button label="+1" variant="ghost" onPress={() => adjustQuantity(item, 1)} loading={busyId === item.id} disabled={busyId === item.id} />
                        <Button label="Edit" variant="secondary" onPress={() => startEdit(item)} disabled={busyId === item.id} />
                        <Button label="Delete" variant="ghost" onPress={() => remove(item)} loading={busyId === item.id} disabled={busyId === item.id} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
