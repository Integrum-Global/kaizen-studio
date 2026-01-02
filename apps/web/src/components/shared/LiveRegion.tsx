/**
 * ARIA live region for dynamic announcements
 */
import { cn } from "@/lib/utils";

interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
  className?: string;
}

export function LiveRegion({
  children,
  politeness = "polite",
  atomic = true,
  relevant = "additions",
  className,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn("sr-only", className)}
    >
      {children}
    </div>
  );
}
