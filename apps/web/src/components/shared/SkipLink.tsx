/**
 * Skip to main content link for keyboard navigation
 */
import { cn } from "@/lib/utils";

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  href = "#main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:absolute focus:top-4 focus:left-4 focus:z-50",
        "focus:bg-background focus:text-foreground",
        "focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
    >
      {children}
    </a>
  );
}
