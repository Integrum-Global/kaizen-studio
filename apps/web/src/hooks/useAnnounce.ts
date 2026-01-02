/**
 * Hook for announcing messages to screen readers using ARIA live regions
 */
import { useCallback, useRef, useEffect } from "react";

type Politeness = "polite" | "assertive";

export function useAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create polite live region
    const polite = document.createElement("div");
    polite.setAttribute("aria-live", "polite");
    polite.setAttribute("aria-atomic", "true");
    polite.className = "sr-only";
    polite.id = "aria-live-polite";
    document.body.appendChild(polite);
    politeRef.current = polite;

    // Create assertive live region
    const assertive = document.createElement("div");
    assertive.setAttribute("aria-live", "assertive");
    assertive.setAttribute("aria-atomic", "true");
    assertive.className = "sr-only";
    assertive.id = "aria-live-assertive";
    document.body.appendChild(assertive);
    assertiveRef.current = assertive;

    return () => {
      polite.remove();
      assertive.remove();
    };
  }, []);

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      const region =
        politeness === "assertive" ? assertiveRef.current : politeRef.current;
      if (region) {
        // Clear and set to trigger announcement
        region.textContent = "";
        requestAnimationFrame(() => {
          region.textContent = message;
        });
      }
    },
    []
  );

  return { announce };
}
