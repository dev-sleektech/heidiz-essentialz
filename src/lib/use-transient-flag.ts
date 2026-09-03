"use client";

// A boolean that flips true and resets itself, for the brief "Added" state
// on the add-to-cart buttons.
//
// The bare `setTimeout(() => setJustAdded(false), 1500)` this replaces had
// no cleanup, so navigating away inside the window set state on an
// unmounted component; and a second click restarted the label without
// clearing the first timer. The ref lets a repeat click extend the same
// window instead of racing it.

import { useCallback, useEffect, useRef, useState } from "react";

export function useTransientFlag(durationMs = 1500): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return [active, trigger];
}
