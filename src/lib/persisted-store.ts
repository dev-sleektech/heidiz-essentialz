// Shared localStorage-backed store behind usePersistedState.
//
// Kept as plain functions in their own module (no React import) so the
// snapshot/caching logic can be unit-tested in node against a fake
// Storage — see scripts/test-persisted-store.mjs.
//
// Three things this fixes over the hand-rolled copy that used to live in
// cart-context, wishlist-context and chat-widget:
//
//  * Writes were unguarded. `localStorage.setItem` throws in Safari private
//    mode and wherever site data is blocked, and an uncaught throw inside a
//    cart update took the whole page down. Reads were already wrapped;
//    writes were not.
//  * Each copy hydrated with a setState-in-effect, which renders once with
//    an empty cart before swapping in the real one — a visible flash of an
//    empty badge on every page load.
//  * Two tabs drifted apart. Adding to the cart in one left the other
//    showing a stale count until reload.

type Listener = () => void;

// getSnapshot must return a referentially stable value or React re-renders
// forever, so each key caches its last parse alongside the raw string it
// came from. A cache entry is only reused while the raw string is unchanged.
type Entry = { raw: string | null; value: unknown };

const cache = new Map<string, Entry>();
const listeners = new Map<string, Set<Listener>>();

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage blocked entirely (private mode, browser setting). Behaves as
    // "nothing stored" — the feature still works for the current page.
    return null;
  }
}

/** Reads the stored value, falling back to `fallback` when the key is
 *  absent or holds unparseable JSON. `fallback` must be a stable reference
 *  (a module constant), since it is returned as-is when nothing is stored. */
export function getSnapshot<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // Malformed entry (hand-edited, or written by an older version).
      // Treat it as absent rather than throwing on every render.
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function subscribe(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);

  // `storage` only fires in *other* tabs, which is exactly the case the
  // local notify below can't cover.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
    window.removeEventListener("storage", onStorage);
  };
}

function notify(key: string) {
  const set = listeners.get(key);
  if (!set) return;
  for (const listener of set) listener();
}

/** Writes a value and wakes every subscriber in this tab. Silently keeps
 *  the in-memory value when storage itself is unavailable, so the feature
 *  degrades to session-only rather than breaking. */
export function writeValue<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
    cache.set(key, { raw, value });
  } catch {
    // Quota exceeded or storage blocked. Keep serving the new value from
    // the cache so the UI still reflects what the customer just did; it
    // simply won't survive a reload.
    cache.set(key, { raw: readRaw(key), value });
  }
  notify(key);
}

export function removeValue(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // nothing to do — see writeValue
  }
  cache.delete(key);
  notify(key);
}

/** Test seam: the module-level caches are process-wide, so a test run has
 *  to be able to start from a clean slate between cases. */
export function __resetForTests(): void {
  cache.clear();
  listeners.clear();
}
