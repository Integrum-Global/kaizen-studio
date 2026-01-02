import { cn } from "@/lib/utils";
import type { ResponsiveContainerProps, ResponsivePadding } from "../types";

/**
 * Responsive container with adaptive padding/margins
 *
 * Applies different padding based on breakpoint for better mobile/desktop UX
 *
 * @example
 * ```tsx
 * <ResponsiveContainer padding="md">
 *   <YourContent />
 * </ResponsiveContainer>
 * ```
 */

const paddingClasses: Record<ResponsivePadding, string> = {
  none: "",
  sm: "p-2 sm:p-3 lg:p-4",
  md: "p-4 sm:p-6 lg:p-8",
  lg: "p-6 sm:p-8 lg:p-12",
  xl: "p-8 sm:p-12 lg:p-16",
};

export function ResponsiveContainer({
  children,
  padding = "md",
  className,
}: ResponsiveContainerProps) {
  return (
    <div className={cn(paddingClasses[padding], className)}>{children}</div>
  );
}
