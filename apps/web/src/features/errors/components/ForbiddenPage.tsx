import { ShieldX, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ForbiddenPage() {
  const handleRequestAccess = () => {
    // TODO: Implement request access functionality
    console.log("Request access clicked");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this resource.
          </p>
          <p className="text-xs text-muted-foreground">
            Contact your administrator if you believe this is a mistake.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button variant="outline" onClick={handleRequestAccess}>
            <Mail className="h-4 w-4 mr-2" />
            Request Access
          </Button>
          <Button onClick={() => (window.location.href = "/")}>
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
