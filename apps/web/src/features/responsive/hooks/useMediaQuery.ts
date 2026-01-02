import { useEffect, useState } from "react";

/**
 * Generic media query hook that returns whether the query matches
 *
 * SSR-safe - returns false on server, then syncs on client
 * Uses matchMedia API for efficient updates
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isWideScreen = useMediaQuery('(min-width: 1200px)');
 *   const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 *   const isLandscape = useMediaQuery('(orientation: landscape)');
 *
 *   return <div>Wide screen: {isWideScreen ? 'Yes' : 'No'}</div>;
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // SSR-safe: Start with false, sync on client
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener("change", listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
