import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
}

/**
 * A grid component that adjusts columns at breakpoints
 * Default behavior:
 * - Mobile: 1 column
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const mobileColsClass = `grid-cols-${cols.mobile || 1}`;
  const tabletColsClass = `sm:grid-cols-${cols.tablet || 2}`;
  const desktopColsClass = `lg:grid-cols-${cols.desktop || 3}`;

  return (
    <div
      className={cn(
        "grid",
        mobileColsClass,
        tabletColsClass,
        desktopColsClass,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}
