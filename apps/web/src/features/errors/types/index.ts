export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  stack?: string;
}

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

export interface ErrorFallbackProps {
  error: Error | AppError;
  resetErrorBoundary: () => void;
}

export interface ErrorAlertProps {
  error: Error | AppError | string;
  onDismiss?: () => void;
  onRetry?: () => void;
  variant?: "default" | "destructive";
}
