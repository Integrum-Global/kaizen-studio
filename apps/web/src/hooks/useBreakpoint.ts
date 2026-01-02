import { useMediaQuery } from "./useMediaQuery";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface BreakpointResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
}

/**
 * Hook to detect current breakpoint based on Tailwind CSS defaults
 * Breakpoints:
 * - mobile: < 640px (< sm)
 * - tablet: 640px - 1024px (sm to lg)
 * - desktop: >= 1024px (>= lg)
 */
export function useBreakpoint(): BreakpointResult {
  const isSmallScreen = useMediaQuery("(min-width: 640px)");
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
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
  };
}
