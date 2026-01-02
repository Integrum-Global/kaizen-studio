import { type ReactNode } from "react";
import { useCanPerform } from "../hooks";
import type { ResourceType, ActionType } from "../types";

interface PermissionGateProps {
  resource: ResourceType;
  action: ActionType;
  children: ReactNode;
  fallback?: ReactNode;
  showLoading?: boolean;
}

/**
 * Component that conditionally renders children based on permission check.
 * Useful for hiding UI elements the user doesn't have access to.
 */
export function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
  showLoading = false,
}: PermissionGateProps) {
  const { data, isLoading } = useCanPerform(resource, action);

  if (isLoading) {
    return showLoading ? (
      <span className="text-muted-foreground">...</span>
    ) : null;
  }

  if (!data?.allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionDeniedProps {
  message?: string;
}

/**
 * Component to display when permission is denied.
 */
export function PermissionDenied({
  message = "You don't have permission to access this resource.",
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

/**
 * Higher-order component for permission-based rendering
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  resource: ResourceType,
  action: ActionType,
  FallbackComponent?: React.ComponentType
) {
  return function WithPermissionComponent(props: P) {
    const { data, isLoading } = useCanPerform(resource, action);

    if (isLoading) {
      return null;
    }

    if (!data?.allowed) {
      return FallbackComponent ? <FallbackComponent /> : <PermissionDenied />;
    }

    return <WrappedComponent {...props} />;
  };
}
