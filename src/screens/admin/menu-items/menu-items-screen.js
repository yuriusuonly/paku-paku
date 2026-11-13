import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "../../../components/alert.js";
import { Button } from "../../../components/button.js";
import { Header } from "../../../components/header.js";
import { CircularProgress } from "../../../components/circular-progress.js";
import { ScreenContainer } from "../../../components/container.js";
import { TextField } from "../../../components/text-field.js";
import { useAuthStore } from "../../../stores/auth-store.js";
import { useMenuStore } from "../../../stores/menu-store.js";
import { useNotificationStore } from "../../../stores/notification-store.js";

/**
 * Admin menu items management screen.
 * @module screens/admin/menu-items/menu-items-screen
 */

const emptyForm = { id: null, name: "", description: "", price_cents: "", sort_order: "0", is_available: true };

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

  const editItem = (item) => {
    setForm({
      id: item.id,
      name: item.name || "",
      description: item.description || "",
      price_cents: String(item.price_cents ?? ""),
      sort_order: String(item.sort_order ?? 0),
      is_available: Boolean(item.is_available)
    });
    setLocalError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setLocalError("");
  };

  const save = async () => {
    if (!token) return;
    setLocalError("");
    const name = form.name.trim();
    const price = Number(form.price_cents);
    const sortOrder = Number(form.sort_order);
    if (!name || !Number.isInteger(price) || price < 0 || !Number.isInteger(sortOrder)) {
      setLocalError("Please provide a valid name, a non-negative whole-number price in cents, and a whole-number sort order.");
      return;
    }
    const payload = {
      name,
      description: form.description.trim() || null,
      price_cents: price,
      sort_order: sortOrder,
      is_available: Boolean(form.is_available)
    };
    setSaving(true);
    try {
      if (form.id) {
        await updateItem(token, form.id, payload);
        showSuccess("Menu item updated.");
      } else {
        await createItem(token, payload);
        showSuccess("Menu item created.");
      }
      setForm(emptyForm);
    } catch (e) {
      const message = e?.message || "Could not save the menu item. Please try again.";
      setLocalError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!token) return;
    setLocalError("");
    setDeletingId(id);
    try {
      await removeItem(token, id);
      if (form.id === id) setForm(emptyForm);
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
            <Text className="font-outfit text-3xl font-black tracking-tight text-[#161823]">Menu items management</Text>
            <Text className="font-outfit mt-2 text-base text-[#161823]/70">Changes sync in real time across open screens and devices.</Text>
          </View>
          <Link href="/admin" asChild><Button label="Back" variant="ghost" /></Link>
        </View>

        <Alert variant="error" message={localError || error} />

        <View className="mt-4 rounded-3xl border border-[#161823]/10 bg-[#161823]/[0.02] p-5 gap-3">
          <Text className="font-outfit text-lg font-bold text-[#161823]">{form.id ? "Edit item" : "New item"}</Text>
          <TextField label="Name" value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Takoyaki" />
          <TextField label="Description" value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Description" />
          <TextField label="Price (cents)" value={form.price_cents} onChangeText={(v) => setForm((f) => ({ ...f, price_cents: v }))} placeholder="650" keyboardType="numeric" />
          <TextField label="Sort order" value={form.sort_order} onChangeText={(v) => setForm((f) => ({ ...f, sort_order: v }))} placeholder="0" keyboardType="numeric" />
          <View className="flex-row items-center gap-3">
            <Button label={form.is_available ? "Available" : "Unavailable"} variant="ghost" onPress={() => setForm((f) => ({ ...f, is_available: !f.is_available }))} />
            <Button label={form.id ? "Update item" : "Create item"} onPress={save} loading={saving} />
            {form.id ? <Button label="Cancel" variant="ghost" onPress={resetForm} /> : null}
          </View>
        </View>

        <View className="mt-8 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="font-outfit text-xl font-bold text-[#161823]">Menu items</Text>
            {syncing ? <CircularProgress size="small" /> : null}
          </View>
          <Text className="font-outfit text-sm text-[#161823]/50">
            {loading ? "Loading..." : syncing ? "Syncing changes..." : `${sorted.length} total`}
          </Text>
        </View>

        {showInitialLoading ? <CircularProgress message="Loading menu items..." /> : null}

        {!loading && !error && sorted.length === 0 ? (
          <Alert variant="info" message="No menu items yet. Create one above to get started." />
        ) : null}

        {sorted.length > 0 ? (
          <View className={`gap-3 ${syncing ? "opacity-80" : "opacity-100"}`}>
            {sorted.map((item) => (
              <View key={item.id} className="rounded-2xl border border-[#161823]/10 bg-[#161823]/[0.02] p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-outfit text-base font-bold text-[#161823]">{item.name}</Text>
                    <Text className="font-outfit mt-1 text-xs text-[#161823]/50">¥{Math.round((item.price_cents || 0))} · sort {item.sort_order} · {item.is_available ? "available" : "hidden"}</Text>
                    {item.description ? <Text className="font-outfit mt-1 text-sm text-[#161823]/70">{item.description}</Text> : null}
                  </View>
                  <View className="flex-row gap-2">
                    <Button label="Edit" variant="ghost" onPress={() => editItem(item)} />
                    <Button label="Delete" variant="ghost" onPress={() => remove(item.id)} loading={deletingId === item.id} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
