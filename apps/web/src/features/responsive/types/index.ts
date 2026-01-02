/**
 * Responsive system type definitions
 */

export type Breakpoint = "mobile" | "tablet" | "desktop";

export type Orientation = "portrait" | "landscape";

export interface BreakpointConfig {
  mobile: number; // 0-639px
  tablet: number; // 640-1023px
  desktop: number; // 1024px+
}

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface UseBreakpointResult {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface UseOrientationResult {
  orientation: Orientation;
  isPortrait: boolean;
  isLandscape: boolean;
}

export type ResponsivePadding = "none" | "sm" | "md" | "lg" | "xl";

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  padding?: ResponsivePadding;
  className?: string;
}

export interface ShowProps {
  children: React.ReactNode;
  on: Breakpoint | Breakpoint[];
}

export interface HideProps {
  children: React.ReactNode;
  on: Breakpoint | Breakpoint[];
}
