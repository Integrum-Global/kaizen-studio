import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorFallbackProps } from "../types";

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const errorMessage =
    "message" in error ? error.message : "An unexpected error occurred";

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          {errorMessage && (
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {errorMessage}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
