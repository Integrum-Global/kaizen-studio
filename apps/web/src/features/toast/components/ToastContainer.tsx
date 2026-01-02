import * as React from "react";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ToastPosition } from "../types";

/**
 * Toast container props
 */
export interface ToastContainerProps {
  /**
   * Children (toast elements)
   */
  children: React.ReactNode;

  /**
   * Position of the toast container
   */
  position?: ToastPosition;

  /**
   * Maximum number of visible toasts
   */
  maxVisible?: number;

  /**
   * Whether newest toasts appear on top (true) or bottom (false)
   */
  newestOnTop?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Position class mapping
 */
const POSITION_CLASSES: Record<ToastPosition, string> = {
  "top-right": "top-0 right-0 flex-col-reverse sm:flex-col",
  "top-left": "top-0 left-0 flex-col-reverse sm:flex-col",
  "top-center": "top-0 left-1/2 -translate-x-1/2 flex-col-reverse sm:flex-col",
  "bottom-right": "bottom-0 right-0 flex-col",
  "bottom-left": "bottom-0 left-0 flex-col",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 flex-col",
};

/**
 * ToastContainer manages toast positioning and stacking
 *
 * @example
 * ```tsx
 * <ToastContainer position="top-right" maxVisible={5}>
 *   {toasts.map(toast => <EnhancedToast key={toast.id} {...toast} />)}
 * </ToastContainer>
 * ```
 */
export function ToastContainer({
  children,
  position = "bottom-right",
  maxVisible = 5,
  newestOnTop = true,
  className,
}: ToastContainerProps) {
  const positionClass = POSITION_CLASSES[position];

  // Convert children to array and limit visible toasts
  const childArray = React.Children.toArray(children);
  const visibleChildren = newestOnTop
    ? childArray.slice(0, maxVisible)
    : childArray.slice(-maxVisible);

  return (
    <ToastProvider>
      {visibleChildren}
      <ToastViewport
        className={cn(
          "fixed z-[100] flex max-h-screen w-full p-4 md:max-w-[420px]",
          positionClass,
          className
        )}
      />
    </ToastProvider>
  );
}
