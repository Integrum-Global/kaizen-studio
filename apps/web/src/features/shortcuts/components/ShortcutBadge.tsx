/**
 * Display keyboard shortcut keys in UI
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatKeyDisplay } from "../utils/platform";

interface ShortcutBadgeProps {
  keys: string[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Display keyboard shortcut as badges
 *
 * @example
 * ```tsx
 * <ShortcutBadge keys={['Control', 'K']} />
 * // Renders: Ctrl+K (or ⌘K on Mac)
 * ```
 */
export function ShortcutBadge({
  keys,
  className,
  size = "sm",
}: ShortcutBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-2.5 py-1.5",
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          <Badge
            variant="outline"
            className={cn(
              "font-mono font-medium",
              sizeClasses[size],
              "bg-muted/50"
            )}
          >
            {formatKeyDisplay(key)}
          </Badge>
          {index < keys.length - 1 && (
            <span className="mx-0.5 text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Display shortcut inline with text
 */
export function InlineShortcut({
  keys,
  className,
}: Omit<ShortcutBadgeProps, "size">) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", className)}>
      {keys.map((key, index) => (
        <span key={index} className="inline-flex items-center">
          <kbd className="px-1.5 py-0.5 text-xs font-mono font-medium bg-muted rounded border border-border">
            {formatKeyDisplay(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="mx-0.5 text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </span>
  );
}
