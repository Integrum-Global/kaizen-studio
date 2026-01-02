import { useCallback } from "react";

interface UseErrorBoundaryReturn {
  resetErrorBoundary: () => void;
  showBoundary: (error: Error) => void;
}

/**
 * Hook for programmatically controlling error boundaries.
 *
 * Note: This hook is primarily for throwing errors to be caught by
 * an ErrorBoundary component. It does not maintain error state internally.
 */
export function useErrorBoundary(): UseErrorBoundaryReturn {
  const resetErrorBoundary = useCallback(() => {
    // This is a placeholder that can be overridden by error boundary implementation
    // In practice, this would typically trigger a re-render or state reset
    window.location.reload();
  }, []);

  const showBoundary = useCallback((error: Error) => {
    // Throw the error to be caught by the nearest error boundary
    throw error;
  }, []);

  return {
    resetErrorBoundary,
    showBoundary,
  };
}
