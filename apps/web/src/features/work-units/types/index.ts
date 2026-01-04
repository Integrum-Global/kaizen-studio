/**
 * Work Unit Types
 *
 * Defines the unified Work Unit model that replaces separate Agent and Pipeline concepts.
 * A Work Unit represents any unit of work in the system, either atomic (single capability)
 * or composite (orchestration of multiple work units).
 *
 * @see docs/plans/eatp-ontology/02-work-unit-model.md
 */

/**
 * Trust status for a work unit
 */
export type TrustStatus = 'valid' | 'expired' | 'revoked' | 'pending';

/**
 * Type of work unit
 * - atomic: A single capability that executes directly (e.g., data extraction, document analysis)
 * - composite: Orchestrates other work units for complex tasks (e.g., invoice processing pipeline)
 */
export type WorkUnitType = 'atomic' | 'composite';

/**
 * User experience level in the EATP hierarchy
 * - Level 1 (Task Performer): Can run tasks, view results
 * - Level 2 (Process Owner): Can configure, delegate, manage workspaces
 * - Level 3 (Value Chain Owner): Enterprise-wide view, compliance, trust establishment
 */
export type UserLevel = 1 | 2 | 3;

/**
 * Capability attached to a work unit
 */
export interface Capability {
  id: string;
  name: string;
  description: string;
  type: 'access' | 'action' | 'delegation';
  constraints: string[];
}

/**
 * Trust information for a work unit
 */
export interface TrustInfo {
  status: TrustStatus;
  establishedAt?: string;
  expiresAt?: string;
  delegatedBy?: {
    userId: string;
    userName: string;
    role?: string;
  };
  trustChainId?: string;
}

/**
 * Execution run result
 */
export interface RunResult {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

/**
 * Sub-unit reference for composite work units
 */
export interface SubUnit {
  id: string;
  name: string;
  type: WorkUnitType;
  trustStatus: TrustStatus;
  position: number;
}

/**
 * Workspace reference
 */
export interface WorkspaceRef {
  id: string;
  name: string;
  color?: string;
}

/**
 * Workspace type - categorizes how the workspace is used
 * - permanent: Long-lived organizational functions (e.g., "Finance Operations")
 * - temporary: Project-based, time-limited (e.g., "Q4 Audit Prep")
 * - personal: Individual user collections (e.g., "My Favorites")
 */
export type WorkspaceType = 'permanent' | 'temporary' | 'personal';

/**
 * Member role within a workspace
 * - owner: Full control, can delete workspace
 * - admin: Can manage members and work units
 * - member: Can run work units
 * - viewer: Read-only access
 */
export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Member of a workspace
 */
export interface WorkspaceMember {
  userId: string;
  userName: string;
  email?: string;
  role: WorkspaceMemberRole;
  department?: string;
  constraints?: Record<string, unknown>;
  joinedAt: string;
  invitedBy?: string;
}

/**
 * Work unit reference within a workspace
 */
export interface WorkspaceWorkUnit {
  workUnitId: string;
  workUnitName: string;
  workUnitType: WorkUnitType;
  trustStatus: TrustStatus;
  delegationId?: string;
  constraints?: Record<string, unknown>;
  addedAt: string;
  addedBy: string;
  department?: string;
}

/**
 * Full Workspace model
 * Purpose-driven collections that can cross departmental boundaries.
 * Unlike folders, workspaces are lenses - work units can belong to multiple workspaces.
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  workspaceType: WorkspaceType;
  color?: string;

  // Ownership
  ownerId: string;
  ownerName: string;
  organizationId: string;

  // Members and work units
  members: WorkspaceMember[];
  workUnits: WorkspaceWorkUnit[];
  memberCount: number;
  workUnitCount: number;

  // Lifecycle
  expiresAt?: string;
  archivedAt?: string;
  isArchived: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary of a workspace for list views
 */
export interface WorkspaceSummary {
  id: string;
  name: string;
  description?: string;
  workspaceType: WorkspaceType;
  color?: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  workUnitCount: number;
  expiresAt?: string;
  isArchived: boolean;
  isPersonal: boolean;
}

/**
 * Input for creating a new workspace
 */
export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  workspaceType: WorkspaceType;
  color?: string;
  expiresAt?: string;
  initialMembers?: Array<{ userId: string; role: WorkspaceMemberRole }>;
}

/**
 * Input for updating a workspace
 */
export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  color?: string;
  expiresAt?: string;
}

/**
 * Filters for workspace list queries
 */
export interface WorkspaceFilters {
  search?: string;
  workspaceType?: WorkspaceType | 'all';
  includeArchived?: boolean;
  ownerId?: string;
}

/**
 * Core Work Unit model
 * Unified representation replacing separate Agent and Pipeline models
 */
export interface WorkUnit {
  id: string;
  name: string;
  description: string;
  type: WorkUnitType;
  capabilities: string[];
  trustInfo: TrustInfo;

  // Composite-specific fields
  subUnits?: SubUnit[];
  subUnitCount?: number;

  // Organization
  workspaceId?: string;
  workspace?: WorkspaceRef;

  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;

  // Tags for filtering
  tags?: string[];
}

/**
 * Work unit filters for list queries
 */
export interface WorkUnitFilters {
  search?: string;
  type?: WorkUnitType | 'all';
  trustStatus?: TrustStatus | 'all';
  workspaceId?: string;
  tags?: string[];
}

/**
 * Input for creating a new work unit
 */
export interface CreateWorkUnitInput {
  name: string;
  description: string;
  type: WorkUnitType;
  capabilities?: Capability[];
  workspaceId?: string;
  tags?: string[];
  subUnitIds?: string[]; // For composite units
}

/**
 * Input for updating a work unit
 */
export interface UpdateWorkUnitInput {
  name?: string;
  description?: string;
  capabilities?: Capability[];
  workspaceId?: string;
  tags?: string[];
}

/**
 * Input for running a work unit
 */
export interface RunWorkUnitInput {
  workUnitId: string;
  inputs?: Record<string, unknown>;
}

/**
 * Paginated response for work unit lists
 */
export interface WorkUnitListResponse {
  items: WorkUnit[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * User permissions based on level
 */
export interface UserPermissions {
  canRun: boolean;
  canConfigure: boolean;
  canDelegate: boolean;
  canCreateWorkUnits: boolean;
  canManageWorkspaces: boolean;
  canViewValueChains: boolean;
  canAccessCompliance: boolean;
  canEstablishTrust: boolean;
  canDelete: boolean;
}

/**
 * User context for the EATP system
 */
export interface UserContext {
  userId: string;
  userName: string;
  email: string;
  level: UserLevel;
  permissions: UserPermissions;
  organizationId: string;
  organizationName: string;
  teamIds: string[];
}

/**
 * Get permissions for a given user level
 */
export function getPermissionsForLevel(level: UserLevel): UserPermissions {
  return {
    canRun: level >= 1,
    canConfigure: level >= 2,
    canDelegate: level >= 2,
    canCreateWorkUnits: level >= 2,
    canManageWorkspaces: level >= 2,
    canViewValueChains: level >= 3,
    canAccessCompliance: level >= 3,
    canEstablishTrust: level >= 3,
    canDelete: level >= 3,
  };
}

/**
 * Check if user can perform action on work unit
 */
export function canPerformAction(
  action: 'run' | 'configure' | 'delegate' | 'delete',
  userLevel: UserLevel,
  trustStatus: TrustStatus
): { allowed: boolean; reason?: string } {
  const permissions = getPermissionsForLevel(userLevel);

  switch (action) {
    case 'run':
      if (!permissions.canRun) {
        return { allowed: false, reason: 'Insufficient permission level' };
      }
      if (trustStatus !== 'valid') {
        return { allowed: false, reason: `Cannot run: trust is ${trustStatus}` };
      }
      return { allowed: true };

    case 'configure':
      if (!permissions.canConfigure) {
        return { allowed: false, reason: 'Requires Level 2 or higher' };
      }
      return { allowed: true };

    case 'delegate':
      if (!permissions.canDelegate) {
        return { allowed: false, reason: 'Requires Level 2 or higher' };
      }
      if (trustStatus !== 'valid') {
        return { allowed: false, reason: `Cannot delegate: trust is ${trustStatus}` };
      }
      return { allowed: true };

    case 'delete':
      if (!permissions.canDelete) {
        return { allowed: false, reason: 'Requires Level 3' };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}
