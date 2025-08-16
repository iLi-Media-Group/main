import { useEffect, useRef } from 'react';

/**
 * A stable useEffect hook that prevents unwanted refreshes
 * Only runs the effect once when dependencies are first met, then only when they actually change
 */
export function useStableEffect(
  effect: () => void | (() => void),
  dependencies: any[],
  condition?: () => boolean
) {
  const hasInitialized = useRef(false);
  const lastDeps = useRef<any[]>([]);

  useEffect(() => {
    // Check if dependencies have actually changed
    const depsChanged = dependencies.some((dep, index) => {
      return lastDeps.current[index] !== dep;
    });

    // Check if condition is met (if provided)
    const conditionMet = condition ? condition() : true;

    // Only run effect if:
    // 1. We haven't initialized yet, OR
    // 2. Dependencies have actually changed, AND
    // 3. Condition is met
    if ((!hasInitialized.current || depsChanged) && conditionMet) {
      hasInitialized.current = true;
      lastDeps.current = [...dependencies];
      return effect();
    }
  }, dependencies);
}

/**
 * A stable useEffect hook specifically for data fetching
 * Only fetches data once when user is authenticated and hasn't fetched yet
 */
export function useStableDataFetch(
  fetchFunction: () => Promise<void>,
  dependencies: any[],
  userCheck?: () => boolean
) {
  const hasFetched = useRef(false);

  useEffect(() => {
    // Reset fetch flag when dependencies change
    hasFetched.current = false;
    
    // Check if user is authenticated (if userCheck provided)
    const userAuthenticated = userCheck ? userCheck() : true;
    
    // Only fetch if user is authenticated and we haven't fetched yet
    if (userAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      fetchFunction();
    }
  }, dependencies);
}
