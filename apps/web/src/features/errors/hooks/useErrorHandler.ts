import { useState, useCallback } from "react";
import { AppError, ErrorContext } from "../types";

interface UseErrorHandlerReturn {
  error: AppError | null;
  handleError: (error: Error, context?: ErrorContext) => void;
  clearError: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((error: Error, context?: ErrorContext) => {
    const appError: AppError = {
      code: error.name || "UNKNOWN_ERROR",
      message: error.message || "An unexpected error occurred",
      details: context?.metadata
        ? JSON.stringify(context.metadata, null, 2)
        : undefined,
      timestamp: new Date(),
      stack: error.stack,
    };

    // Log error with context
    console.error("[ErrorHandler]", {
      error: appError,
      context,
    });

    setError(appError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}
