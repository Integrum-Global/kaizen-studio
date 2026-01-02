import * as React from "react";
import { cva } from "class-variance-authority";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastTitle,
} from "@/components/ui/toast";
import { ToastIcon } from "./ToastIcon";
import { cn } from "@/lib/utils";
import { ToastType } from "../types";

/**
 * Enhanced toast variant styles
 */
const enhancedToastVariants = cva("", {
  variants: {
    variant: {
      default: "border bg-background text-foreground",
      success:
        "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
      error:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
      warning:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
      info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Enhanced toast component props
 */
export interface EnhancedToastProps {
  /**
   * Toast variant type
   */
  variant?: ToastType;

  /**
   * Toast title
   */
  title?: React.ReactNode;

  /**
   * Toast description
   */
  description?: React.ReactNode;

  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;

  /**
   * Whether to show a progress bar
   */
  showProgress?: boolean;

  /**
   * Duration in milliseconds (for progress bar calculation)
   */
  duration?: number;

  /**
   * Whether the toast is closable
   */
  closable?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Whether the toast is open
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * EnhancedToast component with variant-based styling and icons
 *
 * @example
 * ```tsx
 * <EnhancedToast
 *   variant="success"
 *   title="Success"
 *   description="Operation completed successfully"
 * />
 * ```
 */
export const EnhancedToast = React.forwardRef<
  React.ElementRef<typeof Toast>,
  EnhancedToastProps
>(
  (
    {
      className,
      variant = "default",
      title,
      description,
      icon,
      showProgress = false,
      duration = 5000,
      closable = true,
      open,
      onOpenChange,
    },
    ref
  ) => {
    const [progress, setProgress] = React.useState(100);
    const startTimeRef = React.useRef<number>(Date.now());

    // Update progress bar
    React.useEffect(() => {
      if (!showProgress || duration === 0) return;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [showProgress, duration]);

    // Determine ARIA attributes based on variant
    const ariaRole = variant === "error" ? "alert" : "status";
    const ariaLive = variant === "error" ? "assertive" : "polite";

    // Map our custom variants to Toast's base variants
    const baseVariant = variant === "error" ? "destructive" : "default";

    return (
      <Toast
        ref={ref}
        variant={baseVariant}
        className={cn(enhancedToastVariants({ variant }), className)}
        role={ariaRole}
        aria-live={ariaLive}
        open={open}
        onOpenChange={onOpenChange}
      >
        <div className="flex w-full items-start gap-3">
          {variant !== "default" && variant && (
            <ToastIcon variant={variant} customIcon={icon} className="mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
        </div>
        {showProgress && duration > 0 && (
          <div
            className="absolute bottom-0 left-0 h-1 rounded-b-md bg-current opacity-30 transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time remaining"
          />
        )}
        {closable && <ToastClose />}
      </Toast>
    );
  }
);

EnhancedToast.displayName = "EnhancedToast";
