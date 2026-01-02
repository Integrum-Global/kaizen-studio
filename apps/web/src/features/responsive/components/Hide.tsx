import { useBreakpoint } from "../hooks/useBreakpoint";
import type { HideProps, Breakpoint } from "../types";

/**
 * Conditional rendering component - hides children at specified breakpoints
 *
 * @example
 * ```tsx
 * // Hide only on mobile
 * <Hide on="mobile">
 *   <ComplexVisualization />
 * </Hide>
 *
 * // Hide on multiple breakpoints
 * <Hide on={["mobile", "tablet"]}>
 *   <DesktopOnlyFeature />
 * </Hide>
 * ```
 */
export function Hide({ children, on }: HideProps) {
  const { breakpoint } = useBreakpoint();

  // Convert single breakpoint to array for consistent handling
  const breakpoints = Array.isArray(on) ? on : [on];

  // Check if current breakpoint is in the list
  const shouldHide = breakpoints.includes(breakpoint as Breakpoint);

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
}
