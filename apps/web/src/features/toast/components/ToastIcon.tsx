import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastType } from "../types";

/**
 * Icon component props
 */
interface ToastIconProps {
  /**
   * Toast variant to determine icon and color
   */
  variant: ToastType;

  /**
   * Custom icon to override default
   */
  customIcon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Maps toast variant to Lucide icon component
 */
const VARIANT_ICON_MAP: Record<ToastType, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

/**
 * Maps toast variant to icon color classes
 */
const VARIANT_COLOR_MAP: Record<ToastType, string> = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
  default: "text-foreground",
};

/**
 * ToastIcon displays an icon based on the toast variant
 *
 * @example
 * ```tsx
 * <ToastIcon variant="success" />
 * <ToastIcon variant="error" customIcon={<CustomIcon />} />
 * ```
 */
export function ToastIcon({ variant, customIcon, className }: ToastIconProps) {
  if (customIcon) {
    return <div className={cn("flex-shrink-0", className)}>{customIcon}</div>;
  }

  const IconComponent = VARIANT_ICON_MAP[variant];
  const colorClass = VARIANT_COLOR_MAP[variant];

  return (
    <IconComponent
      className={cn("h-5 w-5 flex-shrink-0", colorClass, className)}
      aria-hidden="true"
    />
  );
}
