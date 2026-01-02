/**
 * Governance (RBAC/ABAC) types and interfaces
 */

export type ResourceType =
  | "agent"
  | "pipeline"
  | "deployment"
  | "gateway"
  | "team"
  | "user"
  | "settings"
  | "billing"
  | "audit";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "execute"
  | "manage"
  | "admin";

export type PolicyEffect = "allow" | "deny";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "greater_than"
  | "greater_than_or_equals"
  | "less_than"
  | "less_than_or_equals"
  | "between"
  | "exists"
  | "not_exists";

/**
 * Permission representing a single action on a resource
 */
export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  description?: string;
}

/**
 * Role grouping multiple permissions
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Policy condition for ABAC rules
 */
export interface PolicyCondition {
  id: string;
  attribute: string;
  operator: ConditionOperator;
  value: string | string[] | number | boolean;
}

/**
 * Policy for fine-grained access control (ABAC)
 */
export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: PolicyEffect;
  resource: ResourceType;
  actions: ActionType[];
  conditions: PolicyCondition[];
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role member assignment
 */
export interface RoleMember {
  id: string;
  roleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedAt: string;
  assignedBy: string;
}

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  userId?: string;
  resource: ResourceType;
  action: ActionType;
  context?: Record<string, unknown>;
}

/**
 * Permission check response
 */
export interface PermissionCheckResponse {
  allowed: boolean;
  reason?: string;
  matchedPolicy?: string;
}

/**
 * Filters for role queries
 */
export interface RoleFilter {
  search?: string;
  includeSystem?: boolean;
}

/**
 * Filters for policy queries
 */
export interface PolicyFilter {
  resource?: ResourceType;
  effect?: PolicyEffect;
  enabled?: boolean;
}

/**
 * Response from roles list endpoint
 */
export interface RolesResponse {
  records: Role[];
  total: number;
}

/**
 * Response from policies list endpoint
 */
export interface PoliciesResponse {
  records: Policy[];
  total: number;
}

/**
 * Create role request payload
 */
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: { resource: ResourceType; action: ActionType }[];
}

/**
 * Create policy request payload
 */
export interface CreatePolicyRequest {
  name: string;
  description?: string;
  effect: PolicyEffect;
  resource: ResourceType;
  actions: ActionType[];
  conditions: Omit<PolicyCondition, "id">[];
  priority: number;
}

/**
 * Available permissions grouped by resource
 */
export interface AvailablePermissions {
  resource: ResourceType;
  actions: ActionType[];
}
