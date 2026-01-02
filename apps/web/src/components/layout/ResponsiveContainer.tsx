import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

/**
 * A responsive container wrapper that adjusts padding and max-width at breakpoints
 * Default behavior:
 * - Mobile: px-4 (16px)
 * - Tablet: px-6 (24px)
 * - Desktop: px-8 (32px)
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "full",
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
