# Types and Interfaces

Core type definitions for the Work Units feature.

## Work Unit Types

```typescript
/**
 * User levels in the three-level UX model
 */
export type UserLevel = 1 | 2 | 3;

/**
 * Work unit type - atomic or composite
 */
export type WorkUnitType = 'atomic' | 'composite';

/**
 * Trust status for a work unit
 */
export type TrustStatus = 'valid' | 'expired' | 'revoked' | 'pending';

/**
 * Capability categories for work units
 */
export type Capability =
  | 'extract'
  | 'validate'
  | 'transform'
  | 'analyze'
  | 'generate'
  | 'notify'
  | 'integrate'
  | 'orchestrate';

/**
 * Core work unit model
 */
export interface WorkUnit {
  id: string;
  name: string;
  description?: string;
  type: WorkUnitType;
  capabilities: Capability[];
  trustInfo?: TrustInfo;
  subUnitCount?: number;  // Only for composite
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trust information for a work unit
 */
export interface TrustInfo {
  status: TrustStatus;
  establishedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}
```

## Permission Types

```typescript
/**
 * User permissions based on level
 */
export interface UserPermissions {
  canRun: boolean;
  canViewResults: boolean;
  canConfigure: boolean;
  canDelegate: boolean;
  canEstablishTrust: boolean;
  canManageCompliance: boolean;
  canViewAuditLogs: boolean;
  canDeleteWorkUnits: boolean;
}

/**
 * Available permission keys for type safety
 */
export type PermissionKey = keyof UserPermissions;
```

## Helper Functions

```typescript
/**
 * Get permissions for a given user level
 */
export function getPermissionsForLevel(level: UserLevel): UserPermissions {
  switch (level) {
    case 1:
      return {
        canRun: true,
        canViewResults: true,
        canConfigure: false,
        canDelegate: false,
        canEstablishTrust: false,
        canManageCompliance: false,
        canViewAuditLogs: false,
        canDeleteWorkUnits: false,
      };
    case 2:
      return {
        canRun: true,
        canViewResults: true,
        canConfigure: true,
        canDelegate: true,
        canEstablishTrust: false,
        canManageCompliance: false,
        canViewAuditLogs: false,
        canDeleteWorkUnits: false,
      };
    case 3:
      return {
        canRun: true,
        canViewResults: true,
        canConfigure: true,
        canDelegate: true,
        canEstablishTrust: true,
        canManageCompliance: true,
        canViewAuditLogs: true,
        canDeleteWorkUnits: true,
      };
  }
}

/**
 * Check if an action can be performed given level and trust status
 */
export function canPerformAction(
  action: 'run' | 'configure' | 'delegate' | 'delete',
  level: UserLevel,
  trustStatus: TrustStatus
): boolean {
  const permissions = getPermissionsForLevel(level);

  switch (action) {
    case 'run':
      return permissions.canRun && trustStatus === 'valid';
    case 'configure':
      return permissions.canConfigure;
    case 'delegate':
      return permissions.canDelegate && trustStatus === 'valid';
    case 'delete':
      return permissions.canDeleteWorkUnits;
  }
}
```

## Type Guards

```typescript
/**
 * Check if a work unit is composite
 */
export function isComposite(unit: WorkUnit): boolean {
  return unit.type === 'composite';
}

/**
 * Check if trust is actionable
 */
export function hasTrustIssue(unit: WorkUnit): boolean {
  const status = unit.trustInfo?.status;
  return status === 'expired' || status === 'revoked' || status === 'pending';
}
```

## Usage in Components

```tsx
import type { WorkUnit, UserLevel } from '@/features/work-units/types';
import { canPerformAction } from '@/features/work-units/types';

function WorkUnitActions({ workUnit, userLevel }: Props) {
  const trustStatus = workUnit.trustInfo?.status || 'pending';

  return (
    <Button
      disabled={!canPerformAction('run', userLevel, trustStatus)}
    >
      Run
    </Button>
  );
}
```
