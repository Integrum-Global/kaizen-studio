import { ReactNode } from "react";
import { useHasPermission } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

interface PermissionGateProps {
  /**
   * Required permission to view content
   */
  permission: string;

  /**
   * Content to render if user has permission
   */
  children: ReactNode;

  /**
   * Optional fallback content if user lacks permission
   * If not provided, shows default unauthorized message
   */
  fallback?: ReactNode;

  /**
   * If true, renders nothing instead of fallback when unauthorized
   */
  hideOnUnauthorized?: boolean;
}

/**
 * PermissionGate Component
 * Conditionally renders content based on user permissions
 */
export function PermissionGate({
  permission,
  children,
  fallback,
  hideOnUnauthorized = false,
}: PermissionGateProps) {
  const hasPermission = useHasPermission(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (hideOnUnauthorized) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default unauthorized message
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access this feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Required permission: <code className="font-mono">{permission}</code>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please contact your administrator if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
