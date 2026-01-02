/**
 * Toast notification types and configuration
 */

/**
 * Toast variant types
 */
export type ToastType = "default" | "success" | "error" | "warning" | "info";

/**
 * Toast position options
 */
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

/**
 * Configuration options for toast notifications
 */
export interface ToastConfig {
  /**
   * Toast variant/type
   */
  variant?: ToastType;

  /**
   * Duration in milliseconds before auto-dismissing (0 for no auto-dismiss)
   */
  duration?: number;

  /**
   * Whether the toast can be manually closed
   */
  closable?: boolean;

  /**
   * Custom icon to display (overrides default variant icon)
   */
  icon?: React.ReactNode;

  /**
   * Whether to show a progress bar indicating time remaining
   */
  showProgress?: boolean;

  /**
   * Position of the toast container
   */
  position?: ToastPosition;

  /**
   * ARIA live region politeness setting
   */
  ariaLive?: "polite" | "assertive";

  /**
   * ARIA role for the toast
   */
  ariaRole?: "alert" | "status";
}

/**
 * Loading toast methods
 */
export interface LoadingToastMethods {
  /**
   * Update the loading toast to show success
   */
  success: (title: string, description?: string) => void;

  /**
   * Update the loading toast to show error
   */
  error: (title: string, description?: string) => void;

  /**
   * Dismiss the loading toast
   */
  dismiss: () => void;
}

/**
 * Extended toast configuration with title and description
 */
export interface EnhancedToastConfig extends ToastConfig {
  /**
   * Toast title
   */
  title: string;

  /**
   * Toast description (optional)
   */
  description?: string;
}
