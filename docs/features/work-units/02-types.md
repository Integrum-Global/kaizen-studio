# Work Unit Types

Type definitions for the Work Units feature.

## Core Types

### WorkUnit

The main data structure representing a work unit.

```typescript
interface WorkUnit {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Optional description */
  description?: string;

  /** Work unit type */
  type: 'atomic' | 'composite';

  /** Capabilities this unit provides */
  capabilities: string[];

  /** Trust information */
  trustInfo?: TrustInfo;

  /** Sub-units (composite only) */
  subUnits?: SubUnit[];

  /** Count of sub-units (composite only) */
  subUnitCount?: number;

  /** Creator user ID */
  createdBy: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}
```

### TrustInfo

Trust metadata for a work unit.

```typescript
interface TrustInfo {
  /** Current trust status */
  status: TrustStatus;

  /** When trust was established */
  establishedAt?: string;

  /** When trust expires */
  expiresAt?: string;

  /** Who delegated this trust */
  delegatedBy?: DelegationInfo;
}
```

### TrustStatus

Possible trust states.

```typescript
type TrustStatus = 'valid' | 'expired' | 'revoked' | 'pending';
```

### SubUnit

Reference to a sub-unit within a composite work unit.

```typescript
interface SubUnit {
  /** Sub-unit ID */
  id: string;

  /** Sub-unit name */
  name: string;

  /** Sub-unit type */
  type: 'atomic' | 'composite';

  /** Trust status */
  trustStatus: TrustStatus;

  /** Position in execution order */
  position: number;
}
```

---

## User Level Types

### UserLevel

User permission level (1, 2, or 3).

```typescript
type UserLevel = 1 | 2 | 3;
```

### UserPermissions

Permissions available at each level.

```typescript
interface UserPermissions {
  /** Can execute work units */
  canRun: boolean;

  /** Can configure work units */
  canConfigure: boolean;

  /** Can delegate work units */
  canDelegate: boolean;

  /** Can view trust details */
  canViewTrust: boolean;

  /** Can establish trust */
  canEstablishTrust: boolean;

  /** Can manage workspaces */
  canManageWorkspaces: boolean;

  /** Can view enterprise metrics */
  canViewEnterpriseMetrics: boolean;
}
```

### getPermissionsForLevel

Helper function to get permissions for a level.

```typescript
function getPermissionsForLevel(level: UserLevel): UserPermissions;

// Example
const level2Permissions = getPermissionsForLevel(2);
// Returns: { canRun: true, canConfigure: true, canDelegate: true, ... }
```

---

## Filter Types

### WorkUnitFilters

Filter state for work unit lists.

```typescript
interface WorkUnitFilters {
  /** Search text */
  search?: string;

  /** Filter by type */
  type?: 'atomic' | 'composite';

  /** Filter by trust status */
  trustStatus?: TrustStatus;

  /** Filter by workspace */
  workspaceId?: string;

  /** Filter by capabilities */
  capabilities?: string[];

  /** Sort field */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}
```

---

## Execution Types

### RunResult

Result from executing a work unit.

```typescript
interface RunResult {
  /** Run ID */
  id: string;

  /** Execution status */
  status: 'running' | 'completed' | 'failed' | 'cancelled';

  /** When execution started */
  startedAt: string;

  /** When execution completed */
  completedAt?: string;

  /** Error message if failed */
  error?: string;

  /** Result data */
  result?: unknown;
}
```

---

## Reference Types

### DelegationInfo

Information about who delegated trust.

```typescript
interface DelegationInfo {
  /** Delegator user ID */
  userId: string;

  /** Delegator name */
  userName: string;

  /** Delegator role */
  role?: string;
}
```

### WorkspaceRef

Reference to a workspace.

```typescript
interface WorkspaceRef {
  /** Workspace ID */
  id: string;

  /** Workspace name */
  name: string;

  /** Workspace color */
  color?: string;
}
```

---

## Type Guards

Helper functions to check types.

```typescript
/** Check if work unit is atomic */
function isAtomicWorkUnit(wu: WorkUnit): boolean {
  return wu.type === 'atomic';
}

/** Check if work unit is composite */
function isCompositeWorkUnit(wu: WorkUnit): boolean {
  return wu.type === 'composite';
}

/** Check if trust is valid */
function isTrustValid(trustInfo?: TrustInfo): boolean {
  return trustInfo?.status === 'valid';
}
```

---

## Usage Example

```typescript
import type { WorkUnit, UserLevel, WorkUnitFilters } from '@/features/work-units/types';
import { getPermissionsForLevel, isTrustValid } from '@/features/work-units/types';

// Create a work unit
const workUnit: WorkUnit = {
  id: 'wu-123',
  name: 'Extract Invoice Data',
  type: 'atomic',
  capabilities: ['extract', 'validate'],
  trustInfo: {
    status: 'valid',
    establishedAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-12-31T23:59:59Z',
  },
  createdBy: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Check permissions
const userLevel: UserLevel = 2;
const permissions = getPermissionsForLevel(userLevel);

if (permissions.canRun && isTrustValid(workUnit.trustInfo)) {
  // User can run this work unit
}

// Filter work units
const filters: WorkUnitFilters = {
  type: 'atomic',
  trustStatus: 'valid',
  sortBy: 'name',
  sortOrder: 'asc',
};
```
