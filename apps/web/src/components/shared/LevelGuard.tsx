/**
 * LevelGuard Component
 *
 * Route guard component that restricts access based on user level.
 * Redirects unauthorized users to a fallback route with an optional message.
 *
 * User Levels:
 * - Level 1 (Task Performer): Basic task execution
 * - Level 2 (Process Owner): Configuration, delegation
 * - Level 3 (Value Chain Owner): Enterprise view, compliance
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserLevel, useMinLevel, getLevelLabel } from '@/contexts/UserLevelContext';
import type { UserLevel } from '@/features/work-units/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export interface LevelGuardProps {
  /**
   * Minimum level required to access the route
   */
  minLevel: UserLevel;
  /**
   * Content to render if user meets level requirement
   */
  children: ReactNode;
  /**
   * Route to redirect to if user doesn't meet level requirement
   * If not provided, shows access denied message inline
   */
  redirectTo?: string;
  /**
   * Show loading state while checking level
   */
  showLoading?: boolean;
}

/**
 * Access denied message component
 */
function AccessDeniedMessage({ requiredLevel }: { requiredLevel: UserLevel }) {
  const { level } = useUserLevel();
  const currentLevelLabel = getLevelLabel(level);
  const requiredLevelLabel = getLevelLabel(requiredLevel);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Access Restricted</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This area requires <strong>{requiredLevelLabel}</strong> access.
            Your current level is <strong>{currentLevelLabel}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator to request elevated permissions.
          </p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * LevelGuard Component
 *
 * Protects routes by user level, redirecting or showing access denied
 * message for unauthorized access attempts.
 */
export function LevelGuard({
  minLevel,
  children,
  redirectTo,
  showLoading = false,
}: LevelGuardProps) {
  const location = useLocation();
  const { isLoading } = useUserLevel();
  const meetsLevel = useMinLevel(minLevel);

  // Show loading state if checking level
  if (showLoading && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If user meets level requirement, render children
  if (meetsLevel) {
    return <>{children}</>;
  }

  // If redirect route provided, navigate there
  if (redirectTo) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location, requiredLevel: minLevel }}
        replace
      />
    );
  }

  // Otherwise show access denied message inline
  return <AccessDeniedMessage requiredLevel={minLevel} />;
}

export default LevelGuard;
