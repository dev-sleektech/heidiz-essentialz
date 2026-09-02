// Unit tests for src/lib/persisted-store.ts, the localStorage layer behind
// the cart, wishlist and chat widget. Runs in plain node against a fake
// Storage — no browser needed.
//
// These exist because the cart is the one piece of client state where a
// silent bug costs real money, and it has no other automated coverage.
//
// `node --experimental-strip-types scripts/test-persisted-store.mjs`
// (or `npm run test:store`).

import assert from "node:assert/strict";
import test from "node:test";

class FakeStorage {
  constructor({ throwOnWrite = false, throwOnRead = false } = {}) {
    this.map = new Map();
    this.throwOnWrite = throwOnWrite;
    this.throwOnRead = throwOnRead;
  }
  getItem(k) {
    if (this.throwOnRead) throw new Error("storage blocked");
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    if (this.throwOnWrite) throw new Error("quota exceeded");
    this.map.set(k, v);
  }
  removeItem(k) {
    this.map.delete(k);
  }
}

function installWindow(storage) {
  const handlers = new Set();
  globalThis.window = {
    localStorage: storage,
    addEventListener: (type, fn) => {
      if (type === "storage") handlers.add(fn);
    },
    removeEventListener: (type, fn) => {
      if (type === "storage") handlers.delete(fn);
    },
    // Test helper: simulate another tab writing to storage.
    __fireStorage: (key) => {
      for (const fn of handlers) fn({ key });
    },
  };
  return globalThis.window;
}

const store = await import("../src/lib/persisted-store.ts");

const EMPTY = [];

function fresh(opts) {
  const storage = new FakeStorage(opts);
  const win = installWindow(storage);
  store.__resetForTests();
  return { storage, win };
}

test("returns the fallback when nothing is stored", () => {
  fresh();
  assert.equal(store.getSnapshot("k", EMPTY), EMPTY);
});

test("snapshot is referentially stable across calls (or React loops forever)", () => {
  fresh();
  const a = store.getSnapshot("k", EMPTY);
  const b = store.getSnapshot("k", EMPTY);
  assert.equal(a, b);

  store.writeValue("k", [{ slug: "x", quantity: 1 }]);
  const c = store.getSnapshot("k", EMPTY);
  const d = store.getSnapshot("k", EMPTY);
  assert.equal(c, d, "stable after a write too");
  assert.notEqual(c, a, "but a new value after the write");
});

test("round-trips a value through storage", () => {
  const { storage } = fresh();
  const lines = [{ slug: "lattafa-yara", quantity: 2, unitPrice: 45000 }];
  store.writeValue("cart", lines);
  assert.deepEqual(JSON.parse(storage.getItem("cart")), lines);
  assert.deepEqual(store.getSnapshot("cart", EMPTY), lines);
});

test("reads a value written before this session (a returning customer)", () => {
  const { storage } = fresh();
  storage.setItem("cart", JSON.stringify([{ slug: "afnan-9pm", quantity: 1 }]));
  assert.deepEqual(store.getSnapshot("cart", EMPTY), [{ slug: "afnan-9pm", quantity: 1 }]);
});

test("malformed JSON falls back instead of throwing", () => {
  const { storage } = fresh();
  storage.setItem("cart", "{not json");
  assert.equal(store.getSnapshot("cart", EMPTY), EMPTY);
});

test("a blocked write does not throw and still serves the new value", () => {
  fresh({ throwOnWrite: true });
  assert.doesNotThrow(() => store.writeValue("cart", [{ slug: "x", quantity: 1 }]));
  assert.deepEqual(store.getSnapshot("cart", EMPTY), [{ slug: "x", quantity: 1 }]);
});

test("a blocked read does not throw", () => {
  fresh({ throwOnRead: true });
  assert.doesNotThrow(() => store.getSnapshot("cart", EMPTY));
  assert.equal(store.getSnapshot("cart", EMPTY), EMPTY);
});

test("subscribers are notified on write", () => {
  fresh();
  let calls = 0;
  const unsubscribe = store.subscribe("cart", () => calls++);
  store.writeValue("cart", [1]);
  store.writeValue("cart", [1, 2]);
  assert.equal(calls, 2);
  unsubscribe();
  store.writeValue("cart", [1, 2, 3]);
  assert.equal(calls, 2, "no calls after unsubscribe");
});

test("a write in another tab notifies this one", () => {
  const { win } = fresh();
  let calls = 0;
  const unsubscribe = store.subscribe("cart", () => calls++);
  win.__fireStorage("cart");
  assert.equal(calls, 1);
  win.__fireStorage("wishlist");
  assert.equal(calls, 1, "other keys are ignored");
  unsubscribe();
});

test("another tab's value is picked up on the next snapshot", () => {
  const { storage } = fresh();
  store.writeValue("cart", [{ slug: "a", quantity: 1 }]);
  // Simulates the other tab having written directly to storage.
  storage.setItem("cart", JSON.stringify([{ slug: "b", quantity: 5 }]));
  assert.deepEqual(store.getSnapshot("cart", EMPTY), [{ slug: "b", quantity: 5 }]);
});

test("removeValue clears storage and notifies", () => {
  const { storage } = fresh();
  let calls = 0;
  store.subscribe("chat", () => calls++);
  store.writeValue("chat", "conv_123");
  store.removeValue("chat");
  assert.equal(storage.getItem("chat"), null);
  assert.equal(store.getSnapshot("chat", null), null);
  assert.equal(calls, 2);
});

test("keys are independent", () => {
  fresh();
  store.writeValue("cart", [1]);
  store.writeValue("wishlist", [2]);
  assert.deepEqual(store.getSnapshot("cart", EMPTY), [1]);
  assert.deepEqual(store.getSnapshot("wishlist", EMPTY), [2]);
});
