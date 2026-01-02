import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorAlertProps } from "../types";

export function ErrorAlert({
  error,
  onDismiss,
  onRetry,
  variant = "destructive",
}: ErrorAlertProps) {
  const errorMessage =
    typeof error === "string"
      ? error
      : "message" in error
        ? error.message
        : "An error occurred";

  return (
    <Alert variant={variant} className="relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="pr-8">{errorMessage}</AlertDescription>
      <div className="absolute right-2 top-2 flex gap-1">
        {onRetry && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRetry}
            aria-label="Retry"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
