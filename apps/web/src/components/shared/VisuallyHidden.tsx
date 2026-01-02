/**
 * Component that hides content visually but keeps it accessible to screen readers
 */
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div";
}

export function VisuallyHidden({
  children,
  className,
  as: Component = "span",
}: VisuallyHiddenProps) {
  return (
    <Component
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        className
      )}
    >
      {children}
    </Component>
  );
}
