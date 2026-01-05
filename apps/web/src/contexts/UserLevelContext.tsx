/**
 * UserLevelContext
 *
 * Provides user level information and permissions throughout the application.
 * The user level determines which UI elements and features are available:
 *
 * - Level 1 (Task Performer): Basic task execution and result viewing
 * - Level 2 (Process Owner): Configuration, delegation, workspace management
 * - Level 3 (Value Chain Owner): Enterprise view, compliance, trust establishment
 *
 * Level is determined by examining the user's delegations and trust chain position.
 *
 * @see docs/plans/eatp-ontology/03-user-experience-levels.md
 */

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api';
import type {
  UserLevel,
  UserPermissions,
  UserContext as UserContextType,
} from '@/features/work-units/types';
import { getPermissionsForLevel } from '@/features/work-units/types';
import { useAuthStore } from '@/store/auth';

/**
 * API response for user level determination
 */
interface UserLevelResponse {
  level: UserLevel;
  delegationsReceived: number;
  delegationsGiven: number;
  canEstablishTrust: boolean;
  trustChainPosition: 'root' | 'intermediate' | 'leaf' | 'none';
}

/**
 * Extended user context with additional helpers
 */
interface UserLevelContextValue extends UserContextType {
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const UserLevelContext = createContext<UserLevelContextValue | null>(null);

/**
 * Determine user level based on API response
 *
 * The backend calculates the level based on user role:
 * - org_owner → Level 3 (Value Chain Owner)
 * - org_admin → Level 2 (Process Owner)
 * - developer, viewer → Level 1 (Task Performer)
 *
 * We use the level directly from the API response if available,
 * with fallback logic for backwards compatibility.
 */
function determineUserLevel(data: UserLevelResponse | undefined): UserLevel {
  if (!data) {
    return 1; // Default to Level 1
  }

  // Use level from API response if available (preferred)
  if (data.level && data.level >= 1 && data.level <= 3) {
    return data.level as UserLevel;
  }

  // Fallback: determine from delegation/trust data if level not provided
  // Level 3: Can establish trust or is at root/intermediate position
  if (data.canEstablishTrust || data.trustChainPosition === 'root' || data.trustChainPosition === 'intermediate') {
    return 3;
  }

  // Level 2: Has given delegations (manages others)
  if (data.delegationsGiven > 0) {
    return 2;
  }

  // Level 1: Task performer (default)
  return 1;
}

interface UserLevelProviderProps {
  children: ReactNode;
}

/**
 * Provider component for user level context
 */
export function UserLevelProvider({ children }: UserLevelProviderProps) {
  const { user, isAuthenticated } = useAuthStore();

  // Fetch user level data from API
  const {
    data: levelData,
    isLoading,
    error,
    refetch,
  } = useQuery<UserLevelResponse>({
    queryKey: ['user-level', user?.id],
    queryFn: async () => {
      // In a real implementation, this would call the API
      // For now, we'll determine level based on available user data
      try {
        const response = await apiClient.get<UserLevelResponse>(`/api/v1/users/${user?.id}/level`);
        return response.data;
      } catch {
        // Fallback to determining from user roles if API fails
        return {
          level: 1 as UserLevel,
          delegationsReceived: 0,
          delegationsGiven: 0,
          canEstablishTrust: false,
          trustChainPosition: 'none' as const,
        };
      }
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    // Fallback data while loading
    placeholderData: {
      level: 1 as UserLevel,
      delegationsReceived: 0,
      delegationsGiven: 0,
      canEstablishTrust: false,
      trustChainPosition: 'none' as const,
    },
  });

  const level = useMemo(() => determineUserLevel(levelData), [levelData]);
  const permissions = useMemo(() => getPermissionsForLevel(level), [level]);

  const contextValue = useMemo<UserLevelContextValue>(
    () => ({
      userId: user?.id || '',
      userName: user?.name || user?.email || 'Unknown User',
      email: user?.email || '',
      level,
      permissions,
      organizationId: user?.organization_id || '',
      organizationName: user?.organization_name || '',
      teamIds: [], // Teams will be fetched from API when needed
      isLoading,
      error: error as Error | null,
      refetch,
    }),
    [user, level, permissions, isLoading, error, refetch]
  );

  return (
    <UserLevelContext.Provider value={contextValue}>
      {children}
    </UserLevelContext.Provider>
  );
}

/**
 * Hook to access user level context
 */
export function useUserLevel(): UserLevelContextValue {
  const context = useContext(UserLevelContext);

  if (!context) {
    throw new Error('useUserLevel must be used within a UserLevelProvider');
  }

  return context;
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: keyof UserPermissions): boolean {
  const { permissions } = useUserLevel();
  return permissions[permission];
}

/**
 * Hook to check if user meets minimum level requirement
 */
export function useMinLevel(minLevel: UserLevel): boolean {
  const { level } = useUserLevel();
  return level >= minLevel;
}

/**
 * Component that only renders children if user meets minimum level
 */
interface ForLevelProps {
  min: UserLevel;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ForLevel({ min, children, fallback = null }: ForLevelProps) {
  const meetsLevel = useMinLevel(min);
  return <>{meetsLevel ? children : fallback}</>;
}

/**
 * Component that only renders children if user has permission
 */
interface ForPermissionProps {
  permission: keyof UserPermissions;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ForPermission({ permission, children, fallback = null }: ForPermissionProps) {
  const hasPermission = usePermission(permission);
  return <>{hasPermission ? children : fallback}</>;
}

/**
 * Get display label for user level
 */
export function getLevelLabel(level: UserLevel): string {
  switch (level) {
    case 1:
      return 'Task Performer';
    case 2:
      return 'Process Owner';
    case 3:
      return 'Value Chain Owner';
    default:
      return 'Unknown';
  }
}

/**
 * Get description for user level
 */
export function getLevelDescription(level: UserLevel): string {
  switch (level) {
    case 1:
      return 'Execute assigned tasks and view results';
    case 2:
      return 'Configure processes and delegate to team members';
    case 3:
      return 'Manage enterprise-wide value chains and compliance';
    default:
      return '';
  }
}
