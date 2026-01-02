import { useMediaQuery } from "./useMediaQuery";
import type { Breakpoint, UseBreakpointResult } from "../types";

/**
 * Hook to detect current breakpoint based on window width
 *
 * Breakpoints:
 * - mobile: 0-639px
 * - tablet: 640-1023px
 * - desktop: 1024px+
 *
 * Uses matchMedia for performance and SSR-safe initial state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { breakpoint, isMobile, isTablet, isDesktop } = useBreakpoint();
 *
 *   return (
 *     <div>
 *       Current breakpoint: {breakpoint}
 *       {isMobile && <MobileNav />}
 *       {isDesktop && <DesktopNav />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(): UseBreakpointResult {
  // Match Tailwind's sm breakpoint (640px)
  const isSmallScreen = useMediaQuery("(min-width: 640px)");
  // Match Tailwind's xl breakpoint (1024px) - using 1024 instead of 1280 for desktop
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const isMobile = !isSmallScreen;
  const isTablet = isSmallScreen && !isLargeScreen;
  const isDesktop = isLargeScreen;

  let breakpoint: Breakpoint = "mobile";
  if (isDesktop) {
    breakpoint = "desktop";
  } else if (isTablet) {
    breakpoint = "tablet";
  }

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
}
