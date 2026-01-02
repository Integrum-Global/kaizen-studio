import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ServerErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Server Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Something went wrong on our end. Our team has been notified.
          </p>
          <p className="text-xs text-muted-foreground">
            Please try again in a few moments.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
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
