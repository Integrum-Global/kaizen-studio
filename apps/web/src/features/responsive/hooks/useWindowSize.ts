import { useEffect, useState } from "react";
import type { WindowSize } from "../types";

/**
 * Hook to get current window dimensions with debounced resize listener
 *
 * SSR-safe - returns { width: 0, height: 0 } on server
 * Debounces resize events (100ms) for performance
 *
 * @returns Current window width and height
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { width, height } = useWindowSize();
 *
 *   return (
 *     <div>
 *       Window size: {width} x {height}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWindowSize(): WindowSize {
  // SSR-safe initial state
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleResize = () => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce: Wait 100ms before updating
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Set initial size (in case SSR returned 0,0)
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return windowSize;
}
