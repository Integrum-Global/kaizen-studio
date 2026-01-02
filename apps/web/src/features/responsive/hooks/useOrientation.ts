import { useEffect, useState } from "react";
import type { Orientation, UseOrientationResult } from "../types";

/**
 * Hook to detect device/window orientation
 *
 * SSR-safe - returns 'portrait' on server
 * Listens for orientationchange and resize events
 *
 * @returns Current orientation and helper booleans
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { orientation, isPortrait, isLandscape } = useOrientation();
 *
 *   return (
 *     <div>
 *       {isPortrait && <PortraitLayout />}
 *       {isLandscape && <LandscapeLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrientation(): UseOrientationResult {
  const getOrientation = (): Orientation => {
    if (typeof window === "undefined") {
      return "portrait";
    }

    // Use window dimensions as fallback
    // (screen.orientation not available in all browsers)
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === "undefined") {
      return;
    }

    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    // Listen for orientation change
    window.addEventListener("orientationchange", handleOrientationChange);
    // Also listen for resize as backup (not all browsers support orientationchange)
    window.addEventListener("resize", handleOrientationChange);

    // Set initial orientation
    setOrientation(getOrientation());

    // Cleanup
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return {
    orientation,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape",
  };
}
