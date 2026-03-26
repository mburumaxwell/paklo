import * as React from 'react';

/**
 * A hook to determine if the component is mounted.
 * Useful for avoiding hydration mismatches and ensuring certain code only runs on the client side.
 */
export function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
