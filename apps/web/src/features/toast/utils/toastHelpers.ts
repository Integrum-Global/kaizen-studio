import { toast } from "@/hooks/use-toast";
import { ToastType, ToastConfig, EnhancedToastConfig } from "../types";

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG: ToastConfig = {
  duration: 5000,
  closable: true,
  showProgress: false,
};

/**
 * Maps toast variant to ARIA attributes
 */
function getAriaAttributes(variant: ToastType): {
  ariaRole: "alert" | "status";
  ariaLive: "polite" | "assertive";
} {
  return {
    ariaRole: variant === "error" ? "alert" : "status",
    ariaLive: variant === "error" ? "assertive" : "polite",
  };
}

/**
 * Creates a toast with enhanced configuration
 */
export function createToast(config: EnhancedToastConfig) {
  const {
    variant = "default",
    title,
    description,
    duration = DEFAULT_CONFIG.duration,
    closable = DEFAULT_CONFIG.closable,
    icon,
    showProgress = DEFAULT_CONFIG.showProgress,
  } = config;

  const { ariaRole, ariaLive } = getAriaAttributes(variant);

  return toast({
    title,
    description,
    variant: variant === "error" ? "destructive" : "default",
    duration,
    // Pass custom data for EnhancedToast component
    ...({
      toastVariant: variant,
      icon,
      showProgress,
      closable,
      ariaRole,
      ariaLive,
    } as Record<string, unknown>),
  });
}

/**
 * Shows a success toast
 */
export function showSuccessToast(title: string, description?: string) {
  return createToast({
    variant: "success",
    title,
    description,
  });
}

/**
 * Shows an error toast
 */
export function showErrorToast(title: string, description?: string) {
  return createToast({
    variant: "error",
    title,
    description,
  });
}

/**
 * Shows a warning toast
 */
export function showWarningToast(title: string, description?: string) {
  return createToast({
    variant: "warning",
    title,
    description,
  });
}

/**
 * Shows an info toast
 */
export function showInfoToast(title: string, description?: string) {
  return createToast({
    variant: "info",
    title,
    description,
  });
}

/**
 * Shows a loading toast that can be updated
 */
export function showLoadingToast(title: string) {
  const toastInstance = createToast({
    variant: "info",
    title,
    duration: 0, // Don't auto-dismiss
    closable: false,
    showProgress: false,
  });

  return {
    success: (successTitle: string, description?: string) => {
      toastInstance.update({
        id: toastInstance.id,
        title: successTitle,
        description,
        ...({
          toastVariant: "success",
          closable: true,
          duration: 5000,
        } as Record<string, unknown>),
      });
    },
    error: (errorTitle: string, description?: string) => {
      toastInstance.update({
        id: toastInstance.id,
        title: errorTitle,
        description,
        variant: "destructive",
        ...({
          toastVariant: "error",
          closable: true,
          duration: 5000,
        } as Record<string, unknown>),
      });
    },
    dismiss: () => {
      toastInstance.dismiss();
    },
  };
}
