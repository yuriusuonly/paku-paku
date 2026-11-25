import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test
} from "bun:test";

const channel = {
  id: "realtime-test-channel",
  join: mock(() => channel),
  leave: mock(async () => "ok")
};
let statusHandler = null;
let removed = 0;
let notifications = 0;
let itemsApiError = null;

mock.module("../../services/items.js", () => ({
  getItems: async () => {
    if (itemsApiError) throw itemsApiError;
    return { items: [{ id: "i1", name: "Ramen", sort_order: 0 }] };
  },
  createItem: async () => {
    if (itemsApiError) throw itemsApiError;
    return { item: { id: "i2", name: "Tea", sort_order: 1 } };
  },
  updateItem: async (_token, id, input) => {
    if (itemsApiError) throw itemsApiError;
    return { item: { id, ...input, sort_order: 1 } };
  },
  deleteItem: async () => {
    if (itemsApiError) throw itemsApiError;
    return null;
  }
}));
mock.module("../../services/realtime.js", () => ({
  subscribeToTableChanges: (options) => {
    statusHandler = options.onStatus;
    return channel;
  },
  removeRealtimeChannel: async () => {
    removed += 1;
  },
  setRealtimeAuth: () => {}
}));
mock.module("../../stores/notification.store.js", () => ({
  notifyBackgroundError: () => {
    notifications += 1;
  }
}));

const { useItemsStore } = await import("../../stores/items.store.js");

/**
 * Tests for the items store realtime lifecycle.
 * @module test/stores/items.store
 */

describe("items store realtime", () => {
  beforeEach(() => {
    statusHandler = null;
    removed = 0;
    notifications = 0;
    itemsApiError = null;
    useItemsStore.setState({
      channel: null,
      subscribed: false,
      error: null,
      items: []
    });
  });

  afterEach(() => {
    useItemsStore.setState({
      channel: null,
      subscribed: false,
      error: null,
      items: []
    });
  });

  test("marks the channel subscribed on a SUBSCRIBED status", () => {
    useItemsStore.getState().subscribe();
    statusHandler("SUBSCRIBED");

    expect(useItemsStore.getState().subscribed).toBe(true);
    expect(useItemsStore.getState().error).toBeNull();
  });

  test("removes the channel once on a terminal failure and stops retrying", async () => {
    useItemsStore.getState().subscribe();
    statusHandler("CHANNEL_ERROR");
    statusHandler("TIMED_OUT");

    await Promise.resolve();

    expect(removed).toBe(1);
    expect(notifications).toBe(1);
    expect(useItemsStore.getState().channel).toBeNull();
    expect(useItemsStore.getState().subscribed).toBe(false);
    expect(useItemsStore.getState().error).toBe("Live menu updates are temporarily unavailable.");
  });

  test("unsubscribing is safe when no channel is active", async () => {
    await useItemsStore.getState().unsubscribe();

    expect(removed).toBe(0);
    expect(useItemsStore.getState().channel).toBeNull();
  });
});

describe("items store data", () => {
  beforeEach(() => {
    itemsApiError = null;
    useItemsStore.getState().reset();
  });

  test("fetches and sorts items", async () => {
    await useItemsStore.getState().fetchItems();

    expect(useItemsStore.getState().items.map((item) => item.id)).toEqual(["i1"]);
    expect(useItemsStore.getState().loading).toBe(false);
    expect(useItemsStore.getState().error).toBeNull();
  });

  test("reports fetch failures", async () => {
    itemsApiError = new Error("offline");

    await expect(useItemsStore.getState().fetchItems()).rejects.toThrow("offline");
    expect(useItemsStore.getState().error).toBe("offline");
  });

  test("creates, updates and removes items", async () => {
    const store = useItemsStore.getState();

    const created = await store.createItem("token", { name: "Tea" });
    expect(created.id).toBe("i2");
    expect(useItemsStore.getState().items).toContainEqual(created);

    const updated = await store.updateItem("token", "i2", { name: "Green Tea" });
    expect(updated.name).toBe("Green Tea");

    await store.removeItem("token", "i2");
    expect(useItemsStore.getState().items.some((item) => item.id === "i2")).toBe(false);
  });

  test("saveItem routes to create or update based on id", async () => {
    const store = useItemsStore.getState();

    const created = await store.saveItem("token", { name: "Tea" });
    expect(created.id).toBe("i2");

    const updated = await store.saveItem("token", { id: "i2", name: "Green Tea" });
    expect(updated.name).toBe("Green Tea");
  });

  test("replaces local items and resets state", () => {
    const store = useItemsStore.getState();
    store.setItems([{ id: "i9", name: "Cake", sort_order: 2 }]);

    expect(useItemsStore.getState().items[0].id).toBe("i9");

    store.reset();
    expect(useItemsStore.getState().items).toEqual([]);
    expect(useItemsStore.getState().channel).toBeNull();
  });
});
