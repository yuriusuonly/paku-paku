import {
  afterAll,
  afterEach,
  beforeAll,
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
const originalFetch = globalThis.fetch;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
mock.module("../../../src/services/realtime.js", () => ({
  subscribeToTableChanges: (options) => {
    statusHandler = options.onStatus;
    return channel;
  },
  removeRealtimeChannel: async () => {
    removed += 1;
  },
  setRealtimeAuth: () => {}
}));
mock.module("../../../src/stores/notification.store.js", () => ({
  notifyBackgroundError: () => {
    notifications += 1;
  }
}));

// Drive the real service/transport through fetch instead of mocking the
// service module globally: mock.module() leaks across test files when Bun
// runs them in one process (as it does in CI with coverage enabled).
beforeAll(() => {
  globalThis.fetch = mock(async (path, options = {}) => {
    if (itemsApiError) {
      return jsonResponse({ error: { message: itemsApiError.message } }, 400);
    }
    const method = options.method || "GET";
    if (method === "GET") {
      return jsonResponse({ items: [{ id: "i1", name: "Ramen", sort_order: 0 }] });
    }
    const body = options.body ? JSON.parse(options.body) : {};
    if (method === "POST") {
      return jsonResponse({ item: { id: "i2", name: body.name, sort_order: 1 } }, 201);
    }
    if (method === "PATCH") {
      const id = String(path).split("/").pop();
      return jsonResponse({ item: { id, ...body, sort_order: 1 } });
    }
    if (method === "DELETE") {
      return new Response(null, { status: 204 });
    }
    return jsonResponse({}, 404);
  });
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

const { useItemsStore } = await import("../../../src/stores/items.store.js");

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
