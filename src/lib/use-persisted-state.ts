"use client";

// One hook for every piece of state the storefront keeps in localStorage:
// the cart, the wishlist, and the chat widget's conversation id and guest
// identity. Each of those had its own copy of the same load-on-mount /
// write-on-change effect pair; see src/lib/persisted-store.ts for what that
// duplication was getting wrong.
//
// Built on useSyncExternalStore rather than useState + useEffect, which is
// what removes the hydration flash (the value is read during render on the
// client, not one render later) and keeps two open tabs in step.

import { useCallback, useSyncExternalStore } from "react";
import { getSnapshot, removeValue, subscribe, writeValue } from "@/lib/persisted-store";

type Updater<T> = T | ((previous: T) => T);

export function usePersistedState<T>(
  key: string,
  /** Must be a stable reference — a module-level constant, not an inline
   *  literal, or every render returns a new object and React re-renders in
   *  a loop. */
  fallback: T
): [T, (next: Updater<T>) => void, () => void] {
  const value = useSyncExternalStore(
    useCallback((listener: () => void) => subscribe(key, listener), [key]),
    useCallback(() => getSnapshot(key, fallback), [key, fallback]),
    // Server render (and the first client render, which must match it) has
    // no storage to read, so both sides agree on the fallback.
    useCallback(() => fallback, [fallback])
  );

  const setValue = useCallback(
    (next: Updater<T>) => {
      const resolved =
        typeof next === "function"
          ? (next as (previous: T) => T)(getSnapshot(key, fallback))
          : next;
      writeValue(key, resolved);
    },
    [key, fallback]
  );

  const clearValue = useCallback(() => removeValue(key), [key]);

  return [value, setValue, clearValue];
}
