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
import { useSalesStore } from "../../../stores/sales-store.js";
import { cx } from "../../../shared/constants/theme.js";

/**
 * Admin sales management screen.
 * @module screens/admin/sales/sales-screen
 */

function emptyLine() {
  return { item_name: "", quantity: "1", unit_price_cents: "0", menu_item_id: "", inventory_item_id: "" };
}

/**
 * @returns {JSX.Element} Sales management screen.
 */
export default function AdminSalesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const status = useAuthStore((s) => s.status);
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = session?.access_token;
  const isAdmin = status === "authenticated" && user?.role === "admin";

  const sales = useSalesStore((s) => s.sales);
  const loading = useSalesStore((s) => s.loading);
  const syncing = useSalesStore((s) => s.syncing);
  const storeError = useSalesStore((s) => s.error);
  const fetchSales = useSalesStore((s) => s.fetchSales);
  const subscribe = useSalesStore((s) => s.subscribe);
  const unsubscribe = useSalesStore((s) => s.unsubscribe);
  const createSale = useSalesStore((s) => s.createSale);
  const updateSale = useSalesStore((s) => s.updateSale);
  const removeSale = useSalesStore((s) => s.removeSale);

  const menuItems = useMenuStore((s) => s.items);
  const fetchMenuItems = useMenuStore((s) => s.fetchItems);
  const inventoryItems = useInventoryStore((s) => s.items);
  const fetchInventory = useInventoryStore((s) => s.fetchItems);

  const showSuccess = useNotificationStore((s) => s.showSuccess);
  const showError = useNotificationStore((s) => s.showError);

  const [saleForm, setSaleForm] = useState({ customer_name: "", payment_method: "cash", notes: "", status: "completed" });
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!isAdmin) router.replace(status === "authenticated" ? "/menu" : "/signin");
  }, [hydrated, isAdmin, status, router]);

  useEffect(() => {
    if (!hydrated || !isAdmin || !token) return;
    void fetchSales(token).catch(() => {});
    void fetchMenuItems(token).catch(() => {});
    void fetchInventory(token).catch(() => {});
    subscribe(token);
    return () => { void unsubscribe(); };
  }, [hydrated, isAdmin, token, fetchSales, fetchMenuItems, fetchInventory, subscribe, unsubscribe]);

  const summary = useMemo(() => {
    const total = sales.length;
    const completed = sales.filter((s) => s.status === "completed");
    const revenueCents = completed.reduce((sum, s) => sum + Number(s.total_cents || 0), 0);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const todayRevenueCents = completed
      .filter((s) => {
        const d = new Date(s.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
      })
      .reduce((sum, s) => sum + Number(s.total_cents || 0), 0);
    return { total, completedCount: completed.length, revenueCents, todayRevenueCents };
  }, [sales]);

  const draftTotals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const qty = Math.max(0, Number(line.quantity || 0));
        const price = Math.max(0, Number(line.unit_price_cents || 0));
        const lineTotal = Math.round(qty * price);
        acc.items += Number.isFinite(qty) ? qty : 0;
        acc.subtotal += lineTotal;
        return acc;
      },
      { items: 0, subtotal: 0 }
    );
  }, [lines]);

  if (!hydrated || !isAdmin) {
    return (
      <ScreenContainer>
        <CircularProgress message="Checking administrator access..." />
      </ScreenContainer>
    );
  }

  const updateLine = (index, patch) => {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((current) => [...current, emptyLine()]);
  const removeLine = (index) => setLines((current) => (current.length === 1 ? [emptyLine()] : current.filter((_, i) => i !== index)));

  const applyMenuItem = (index, menuItemId) => {
    const menu = menuItems.find((item) => item.id === menuItemId);
    if (!menu) {
      updateLine(index, { menu_item_id: menuItemId });
      return;
    }
    updateLine(index, {
      menu_item_id: menu.id,
      item_name: menu.name || "",
      unit_price_cents: String(menu.price_cents ?? 0)
    });
  };

  const applyInventoryItem = (index, inventoryItemId) => {
    const inv = inventoryItems.find((item) => item.id === inventoryItemId);
    if (!inv) {
      updateLine(index, { inventory_item_id: inventoryItemId });
      return;
    }
    updateLine(index, {
      inventory_item_id: inv.id,
      item_name: inv.name || "",
      unit_price_cents: String(inv.unit_cost_cents ?? linePriceFallback(inv, lines[index]))
    });
  };

  function linePriceFallback(inv, line) {
    return line?.unit_price_cents ?? 0;
  }

  const resetDraft = () => {
    setSaleForm({ customer_name: "", payment_method: "cash", notes: "", status: "completed" });
    setLines([emptyLine()]);
    setLocalError("");
  };

  const submitSale = async () => {
    if (!token) return;
    setLocalError("");
    try {
      const items = lines.map((line, index) => {
        const itemName = line.item_name.trim();
        const quantity = Number(line.quantity);
        const unitPrice = Number(line.unit_price_cents);
        if (!itemName) throw new Error(`Line ${index + 1}: item name is required.`);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Line ${index + 1}: quantity must be a positive whole number.`);
        if (!Number.isInteger(unitPrice) || unitPrice < 0) throw new Error(`Line ${index + 1}: unit price must be a non-negative whole number in cents.`);
        return {
          item_name: itemName,
          quantity,
          unit_price_cents: unitPrice,
          line_total_cents: quantity * unitPrice,
          menu_item_id: line.menu_item_id.trim() || null,
          inventory_item_id: line.inventory_item_id.trim() || null
        };
      });
      if (items.length === 0) throw new Error("Add at least one sale item.");

      await createSale(token, {
        ...saleForm,
        customer_name: saleForm.customer_name.trim() || null,
        payment_method: saleForm.payment_method.trim() || null,
        notes: saleForm.notes.trim() || null,
        items
      });
      showSuccess("Sale recorded.");
      resetDraft();
    } catch (e) {
      const message = e?.message || "Could not record the sale.";
      setLocalError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const markCancelled = async (sale) => {
    if (!token) return;
    setBusyId(sale.id);
    try {
      await updateSale(token, sale.id, { status: "cancelled" });
      showSuccess("Sale marked as cancelled.");
    } catch (e) {
      showError(e?.message || "Could not update the sale.");
    } finally {
      setBusyId(null);
    }
  };

  const markCompleted = async (sale) => {
    if (!token) return;
    setBusyId(sale.id);
    try {
      await updateSale(token, sale.id, { status: "completed" });
      showSuccess("Sale marked as completed.");
    } catch (e) {
      showError(e?.message || "Could not update the sale.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (sale) => {
    if (!token) return;
    setBusyId(sale.id);
    try {
      await removeSale(token, sale.id);
      showSuccess("Sale deleted.");
    } catch (e) {
      showError(e?.message || "Could not delete the sale.");
    } finally {
      setBusyId(null);
    }
  };

  const showInitialLoading = loading && sales.length === 0;

  return (
    <ScreenContainer scrollable contentContainerStyle={{ paddingBottom: 32 }}>
      <Header />
      <View className="mb-6">
        <Link href="/admin" asChild>
          <Text className={`font-outfit mb-4 self-start text-sm font-semibold ${cx.textPrimary}`}>← Back to admin</Text>
        </Link>
        <Text className={`font-outfit text-3xl font-black tracking-tight ${cx.textInk}`}>Sales management</Text>
        <Text className={`font-outfit mt-2 text-base ${cx.textInk70}`}>
          Record transactions, review revenue, and manage sale history in real time.
        </Text>
      </View>

      <Alert variant="error" message={localError || storeError} />

      <View className={`mt-2 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
        <View className="mb-4 flex-row flex-wrap gap-x-6 gap-y-3">
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Sales</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{summary.total}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Completed</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>{summary.completedCount}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Revenue</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(summary.revenueCents / 100).toFixed(2)}</Text></View>
          <View><Text className={`font-outfit text-xs font-semibold uppercase ${cx.textInk60}`}>Today</Text><Text className={`font-outfit text-2xl font-black ${cx.textInk}`}>₱{(summary.todayRevenueCents / 100).toFixed(2)}</Text></View>
        </View>

        <Text className={`font-outfit mb-3 text-lg font-bold ${cx.textInk}`}>Record sale</Text>
        <View className="gap-3">
          <TextField label="Customer name" value={saleForm.customer_name} onChangeText={(v) => setSaleForm((f) => ({ ...f, customer_name: v }))} placeholder="Optional" />
          <TextField label="Payment method" value={saleForm.payment_method} onChangeText={(v) => setSaleForm((f) => ({ ...f, payment_method: v }))} placeholder="cash, card, gcash..." />
          <TextField label="Notes" value={saleForm.notes} onChangeText={(v) => setSaleForm((f) => ({ ...f, notes: v }))} placeholder="Optional notes" multiline numberOfLines={3} />
          <View className="flex-row flex-wrap gap-2">
            {["completed", "pending", "cancelled"].map((value) => (
              <Button key={value} label={value} variant={saleForm.status === value ? "secondary" : "ghost"} onPress={() => setSaleForm((f) => ({ ...f, status: value }))} />
            ))}
          </View>

          <View className="mt-2 gap-3">
            <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>Line items</Text>
            {lines.map((line, index) => (
              <View key={index} className={`rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4 gap-2`}>
                <View className="flex-row items-center justify-between">
                  <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>Item {index + 1}</Text>
                  <Button label="Remove" variant="ghost" onPress={() => removeLine(index)} disabled={saving} />
                </View>
                <TextField label="Item name (*)" value={line.item_name} onChangeText={(v) => updateLine(index, { item_name: v })} placeholder="Item name" />
                <TextField label="Quantity (*)" value={line.quantity} onChangeText={(v) => updateLine(index, { quantity: v })} keyboardType="numeric" placeholder="1" />
                <TextField label="Unit price (cents) (*)" value={line.unit_price_cents} onChangeText={(v) => updateLine(index, { unit_price_cents: v })} keyboardType="numeric" placeholder="0" />
                <TextField label="Menu item ID" value={line.menu_item_id} onChangeText={(v) => applyMenuItem(index, v)} placeholder="Optional menu_items.id" />
                <TextField label="Inventory item ID" value={line.inventory_item_id} onChangeText={(v) => applyInventoryItem(index, v)} placeholder="Optional inventory_items.id (decrements on completed sale)" />
                <Text className={`font-outfit text-sm ${cx.textInk70}`}>
                  Line total: ₱{((Math.max(0, Number(line.quantity || 0)) * Math.max(0, Number(line.unit_price_cents || 0))) / 100).toFixed(2)}
                </Text>
              </View>
            ))}
            <View className="flex-row flex-wrap gap-3">
              <Button label="Add line item" variant="ghost" onPress={addLine} disabled={saving} />
            </View>
            <Text className={`font-outfit text-sm font-semibold ${cx.textInk}`}>
              Draft total: ₱{(draftTotals.subtotal / 100).toFixed(2)} ({draftTotals.items} qty)
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <Button label="Record sale" onPress={() => { setSaving(true); void submitSale().finally(() => setSaving(false)); }} loading={saving} disabled={syncing && !saving} />
              <Button label="Clear" variant="ghost" onPress={resetDraft} disabled={saving} />
            </View>
          </View>
        </View>
      </View>

      <View className={`mt-6 rounded-3xl border ${cx.borderSubtle} ${cx.bgSurface} p-5`}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className={`font-outfit text-lg font-bold ${cx.textInk}`}>Sales history</Text>
          {syncing ? <Text className={`font-outfit text-xs ${cx.textInk60}`}>Syncing...</Text> : null}
        </View>

        {showInitialLoading ? (
          <CircularProgress message="Loading sales..." />
        ) : sales.length === 0 ? (
          <EmptyState message="No sales recorded yet. Create your first sale above." />
        ) : (
          <View className="gap-3">
            {sales.map((sale) => (
              <View key={sale.id} className={`rounded-2xl border ${cx.borderSubtle} ${cx.bgSurfaceSoft} p-4`}>
                <View className="flex-row flex-wrap items-start justify-between gap-3">
                  <View className="flex-1 min-w-[240px]">
                    <Text className={`font-outfit text-base font-bold ${cx.textInk}`}>
                      {sale.sale_number || sale.id} · ₱{(Number(sale.total_cents || 0) / 100).toFixed(2)}
                    </Text>
                    <Text className={`font-outfit mt-1 text-sm ${cx.textInk70}`}>
                      Status: {sale.status} · Payment: {sale.payment_method || "-"} · Customer: {sale.customer_name || "-"}
                    </Text>
                    <Text className={`font-outfit mt-1 text-xs ${cx.textInk60}`}>
                      {new Date(sale.created_at).toLocaleString()} · Items: {(sale.items || []).length}
                    </Text>
                    {sale.notes ? <Text className={`font-outfit mt-2 text-sm ${cx.textInk80}`}>{sale.notes}</Text> : null}
                    {(sale.items || []).length > 0 ? (
                      <View className="mt-2 gap-1">
                        {sale.items.map((item) => (
                          <Text key={item.id} className={`font-outfit text-sm ${cx.textInk70}`}>
                            • {item.item_name} × {item.quantity} @ ₱{(Number(item.unit_price_cents || 0) / 100).toFixed(2)} = ₱{(Number(item.line_total_cents || 0) / 100).toFixed(2)}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {sale.status !== "completed" ? (
                      <Button label="Complete" variant="ghost" onPress={() => markCompleted(sale)} loading={busyId === sale.id} disabled={busyId === sale.id} />
                    ) : null}
                    {sale.status !== "cancelled" ? (
                      <Button label="Cancel" variant="ghost" onPress={() => markCancelled(sale)} loading={busyId === sale.id} disabled={busyId === sale.id} />
                    ) : null}
                    <Button label="Delete" variant="secondary" onPress={() => remove(sale)} loading={busyId === sale.id} disabled={busyId === sale.id} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
