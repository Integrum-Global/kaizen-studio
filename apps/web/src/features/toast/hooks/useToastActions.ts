import { useCallback } from "react";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
} from "../utils/toastHelpers";
import type { LoadingToastMethods } from "../types";

/**
 * Hook providing convenience methods for showing toasts
 *
 * @example
 * ```tsx
 * const { showSuccess, showError, showLoading } = useToastActions();
 *
 * showSuccess("Success!", "Operation completed");
 * showError("Error!", "Something went wrong");
 *
 * const loading = showLoading("Processing...");
 * // Later...
 * loading.success("Done!", "Processing complete");
 * ```
 */
export function useToastActions() {
  const showSuccess = useCallback((title: string, description?: string) => {
    return showSuccessToast(title, description);
  }, []);

  const showError = useCallback((title: string, description?: string) => {
    return showErrorToast(title, description);
  }, []);

  const showWarning = useCallback((title: string, description?: string) => {
    return showWarningToast(title, description);
  }, []);

  const showInfo = useCallback((title: string, description?: string) => {
    return showInfoToast(title, description);
  }, []);

  const showLoading = useCallback((title: string): LoadingToastMethods => {
    return showLoadingToast(title);
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
}
