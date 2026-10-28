import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Idiomatic React 18/19 hook to detect client hydration
 * without triggering cascading renders or setState in useEffect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
