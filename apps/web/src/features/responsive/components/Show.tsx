import { useBreakpoint } from "../hooks/useBreakpoint";
import type { ShowProps, Breakpoint } from "../types";

/**
 * Conditional rendering component - shows children only at specified breakpoints
 *
 * @example
 * ```tsx
 * // Show only on mobile
 * <Show on="mobile">
 *   <MobileMenu />
 * </Show>
 *
 * // Show on multiple breakpoints
 * <Show on={["tablet", "desktop"]}>
 *   <FullMenu />
 * </Show>
 * ```
 */
export function Show({ children, on }: ShowProps) {
  const { breakpoint } = useBreakpoint();

  // Convert single breakpoint to array for consistent handling
  const breakpoints = Array.isArray(on) ? on : [on];

  // Check if current breakpoint is in the list
  const shouldShow = breakpoints.includes(breakpoint as Breakpoint);

  if (!shouldShow) {
    return null;
  }

  return <>{children}</>;
}
