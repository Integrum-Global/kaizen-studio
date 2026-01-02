/**
 * Responsive system feature exports
 *
 * Provides utilities and components for responsive design including:
 * - Breakpoint detection (mobile/tablet/desktop)
 * - Media query hooks
 * - Window size tracking
 * - Device orientation detection
 * - Responsive container components
 * - Conditional rendering components (Show/Hide)
 *
 * @example
 * ```tsx
 * import {
 *   useBreakpoint,
 *   useMediaQuery,
 *   useWindowSize,
 *   useOrientation,
 *   ResponsiveContainer,
 *   Show,
 *   Hide,
 * } from '@/features/responsive';
 *
 * function MyComponent() {
 *   const { breakpoint, isMobile, isDesktop } = useBreakpoint();
 *   const { width, height } = useWindowSize();
 *   const { orientation, isPortrait } = useOrientation();
 *
 *   return (
 *     <ResponsiveContainer padding="md">
 *       <Show on="mobile">
 *         <MobileNav />
 *       </Show>
 *       <Hide on="mobile">
 *         <DesktopNav />
 *       </Hide>
 *     </ResponsiveContainer>
 *   );
 * }
 * ```
 */

// Types
export type {
  Breakpoint,
  Orientation,
  BreakpointConfig,
  ResponsiveState,
  WindowSize,
  UseBreakpointResult,
  UseOrientationResult,
  ResponsivePadding,
  ResponsiveContainerProps,
  ShowProps,
  HideProps,
} from "./types";

// Hooks
export { useBreakpoint } from "./hooks/useBreakpoint";
export { useMediaQuery } from "./hooks/useMediaQuery";
export { useWindowSize } from "./hooks/useWindowSize";
export { useOrientation } from "./hooks/useOrientation";

// Components
export { ResponsiveContainer } from "./components/ResponsiveContainer";
export { Show } from "./components/Show";
export { Hide } from "./components/Hide";
