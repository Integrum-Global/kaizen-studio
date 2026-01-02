import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/auth";
import { useHasPermission } from "../hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Optional permission required to access the route
   */
  permission?: string;
  /**
   * Optional redirect path for unauthorized users
   * Defaults to login page
   */
  redirectTo?: string;
}

/**
 * Loading skeleton component
 */
function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-md p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * ProtectedRoute Component
 * Protects routes by checking authentication and optional permissions
 */
export function ProtectedRoute({
  children,
  permission,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, _hasHydrated } = useAuthStore();
  const hasPermission = permission ? useHasPermission(permission) : true;

  // Wait for zustand to hydrate from localStorage before making auth decisions
  // This prevents flash of login page on refresh
  if (!_hasHydrated) {
    return <AuthLoadingSkeleton />;
  }

  // Show loading state while checking auth (e.g., validating tokens)
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Show unauthorized page if user lacks required permission
  if (permission && !hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Required permission:{" "}
              <code className="font-mono">{permission}</code>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
