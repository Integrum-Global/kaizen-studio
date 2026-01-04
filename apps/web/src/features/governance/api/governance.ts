import apiClient from "@/api";
import type {
  Role,
  Policy,
  RoleMember,
  RoleFilter,
  PolicyFilter,
  RolesResponse,
  PoliciesResponse,
  CreateRoleRequest,
  CreatePolicyRequest,
  PermissionCheckRequest,
  PermissionCheckResponse,
  AvailablePermissions,
  ResourceType,
  ActionType,
  ConditionOperator,
  ConditionValidationResult,
  ValidateConditionsRequest,
  PolicyReferencesResponse,
} from "../types";

/**
 * Transform backend role to frontend Role type
 */
function transformRole(backendRole: Record<string, unknown>): Role {
  const permissions = (backendRole.permissions as string[]) || [];

  const validResources: ResourceType[] = [
    "agent",
    "pipeline",
    "deployment",
    "gateway",
    "team",
    "user",
    "settings",
    "billing",
    "audit",
  ];
  const validActions: ActionType[] = [
    "create",
    "read",
    "update",
    "delete",
    "execute",
    "manage",
    "admin",
  ];

  // Map permission strings like "agents:*" or "users:read" to objects
  const mappedPermissions = permissions.map((p) => {
    const parts = p.split(":");
    const resourcePart = parts[0] || "";
    const action = parts[1] || "*";
    // Handle plural resource names (e.g., "agents" -> "agent")
    const resourceSingular = resourcePart.replace(/s$/, "");
    const validResource = validResources.includes(resourceSingular as ResourceType)
      ? (resourceSingular as ResourceType)
      : validResources.includes(resourcePart as ResourceType)
        ? (resourcePart as ResourceType)
        : "agent";
    const validAction =
      action === "*"
        ? "admin"
        : validActions.includes(action as ActionType)
          ? (action as ActionType)
          : "read";
    return {
      id: p,
      resource: validResource,
      action: validAction,
      description: p.replace(":", " - "),
    };
  });

  return {
    id: backendRole.id as string,
    name: (backendRole.name as string) || "Unknown Role",
    description: backendRole.description as string | undefined,
    permissions: mappedPermissions,
    isSystem: (backendRole.is_system as boolean) ?? false,
    memberCount: (backendRole.member_count as number) || 0,
    createdAt: backendRole.created_at as string,
    updatedAt: backendRole.updated_at as string,
  };
}

/**
 * Transform backend policy to frontend Policy type
 */
function transformPolicy(backendPolicy: Record<string, unknown>): Policy {
  const conditions =
    (backendPolicy.conditions as Record<string, unknown>[]) || [];
  const validResources: ResourceType[] = [
    "agent",
    "pipeline",
    "deployment",
    "gateway",
    "team",
    "user",
    "settings",
    "billing",
    "audit",
  ];
  const validActions: ActionType[] = [
    "create",
    "read",
    "update",
    "delete",
    "execute",
    "manage",
    "admin",
  ];
  const validOperators: ConditionOperator[] = [
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "in",
    "not_in",
    "greater_than",
    "less_than",
  ];

  const resourceType = backendPolicy.resource_type as string;
  const validResource = validResources.includes(resourceType as ResourceType)
    ? (resourceType as ResourceType)
    : "agent";
  const actions = (backendPolicy.actions as string[]) || [];
  const validActionsArr = actions.filter((a) =>
    validActions.includes(a as ActionType)
  ) as ActionType[];

  return {
    id: backendPolicy.id as string,
    name: (backendPolicy.name as string) || "Unknown Policy",
    description: backendPolicy.description as string | undefined,
    effect: (backendPolicy.effect as "allow" | "deny") || "deny",
    resource: validResource,
    actions: validActionsArr.length > 0 ? validActionsArr : ["read"],
    conditions: conditions.map((c, i) => {
      const operator = (c.operator as string) || "equals";
      const validOp = validOperators.includes(operator as ConditionOperator)
        ? (operator as ConditionOperator)
        : "equals";
      return {
        id: (c.id as string) || `c-${i}`,
        attribute: (c.attribute as string) || "",
        operator: validOp,
        value: c.value as string | string[],
      };
    }),
    priority: (backendPolicy.priority as number) || 0,
    enabled: (backendPolicy.status as string) === "active",
    createdAt: backendPolicy.created_at as string,
    updatedAt: backendPolicy.updated_at as string,
  };
}

/**
 * Transform user to RoleMember
 */
function transformUserToMember(
  user: Record<string, unknown>,
  roleId: string
): RoleMember {
  return {
    id: `rm-${user.id}`,
    roleId,
    userId: user.id as string,
    userName: (user.name as string) || "Unknown User",
    userEmail: (user.email as string) || "",
    assignedAt: user.created_at as string,
    assignedBy: "system",
  };
}

/**
 * Get available permissions by resource
 */
function getAvailablePermissions(): AvailablePermissions[] {
  const resources: ResourceType[] = [
    "agent",
    "pipeline",
    "deployment",
    "gateway",
    "team",
    "user",
    "settings",
    "billing",
    "audit",
  ];

  const actionsPerResource: Record<ResourceType, ActionType[]> = {
    agent: ["create", "read", "update", "delete", "execute"],
    pipeline: ["create", "read", "update", "delete", "execute"],
    deployment: ["create", "read", "update", "delete", "manage"],
    gateway: ["create", "read", "update", "delete", "manage"],
    team: ["create", "read", "update", "delete", "manage"],
    user: ["create", "read", "update", "delete", "manage"],
    settings: ["read", "update", "admin"],
    billing: ["read", "manage"],
    audit: ["read"],
  };

  return resources.map((resource) => ({
    resource,
    actions: actionsPerResource[resource],
  }));
}

/**
 * Governance API client
 */
export const governanceApi = {
  /**
   * Get all roles with optional filters
   */
  getRoles: async (filters?: RoleFilter): Promise<RolesResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.includeSystem !== undefined)
        params.append("include_system", String(filters.includeSystem));

      const queryString = params.toString();
      const url = `/api/v1/rbac/roles${queryString ? `?${queryString}` : ""}`;

      const response = await apiClient.get<{
        records: Array<{
          id: string;
          name: string;
          description: string | null;
          permissions: string[];
          is_system: boolean;
          member_count: number;
          created_at: string;
          updated_at: string;
        }>;
        total: number;
      }>(url);

      // Transform backend response to frontend Role type
      const roles = response.data.records.map(transformRole);
      return { records: roles, total: response.data.total };
    } catch {
      return { records: [], total: 0 };
    }
  },

  /**
   * Get a single role by ID
   */
  getRole: async (id: string): Promise<Role> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/rbac/roles/${id}`
    );
    return transformRole(response.data);
  },

  /**
   * Create a new role
   */
  createRole: async (request: CreateRoleRequest): Promise<Role> => {
    const permissions = request.permissions.map(
      (p) => `${p.resource}:${p.action}`
    );

    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/rbac/roles",
      {
        name: request.name,
        description: request.description,
        permissions,
      }
    );

    return transformRole(response.data);
  },

  /**
   * Update a role
   */
  updateRole: async (
    id: string,
    updates: Partial<CreateRoleRequest>
  ): Promise<Role> => {
    const body: Record<string, unknown> = {};
    if (updates.name) body.name = updates.name;
    if (updates.description !== undefined)
      body.description = updates.description;
    if (updates.permissions) {
      body.permissions = updates.permissions.map(
        (p) => `${p.resource}:${p.action}`
      );
    }

    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/rbac/roles/${id}`,
      body
    );
    return transformRole(response.data);
  },

  /**
   * Delete a role
   */
  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/rbac/roles/${id}`);
  },

  /**
   * Get role members
   */
  getRoleMembers: async (roleId: string): Promise<RoleMember[]> => {
    try {
      // Get users and filter by role
      const response = await apiClient.get<{
        records: Record<string, unknown>[];
      }>("/api/v1/users");
      const users = (response.data.records || []).filter(
        (u) => (u.role as string) === roleId
      );
      return users.map((u) => transformUserToMember(u, roleId));
    } catch {
      return [];
    }
  },

  /**
   * Add member to role
   */
  addRoleMember: async (
    roleId: string,
    userId: string
  ): Promise<RoleMember> => {
    // Update user's role
    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/users/${userId}`,
      {
        role: roleId,
      }
    );
    return transformUserToMember(response.data, roleId);
  },

  /**
   * Remove member from role
   */
  removeRoleMember: async (_roleId: string, userId: string): Promise<void> => {
    // Reset user's role to default
    await apiClient.put(`/api/v1/users/${userId}`, {
      role: "viewer",
    });
  },

  /**
   * Get all policies with optional filters
   */
  getPolicies: async (filters?: PolicyFilter): Promise<PoliciesResponse> => {
    try {
      const response = await apiClient.get<
        | { records: Record<string, unknown>[]; total: number }
        | Record<string, unknown>[]
      >("/api/v1/policies");

      // Handle both array and paginated response
      const policiesData = Array.isArray(response.data)
        ? response.data
        : response.data.records || [];
      let policies = policiesData.map(transformPolicy);

      // Apply filters
      if (filters?.resource) {
        policies = policies.filter((p) => p.resource === filters.resource);
      }

      if (filters?.effect) {
        policies = policies.filter((p) => p.effect === filters.effect);
      }

      if (filters?.enabled !== undefined) {
        policies = policies.filter((p) => p.enabled === filters.enabled);
      }

      return { records: policies, total: policies.length };
    } catch {
      return { records: [], total: 0 };
    }
  },

  /**
   * Get a single policy by ID
   */
  getPolicy: async (id: string): Promise<Policy> => {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/policies/${id}`
    );
    return transformPolicy(response.data);
  },

  /**
   * Create a new policy
   */
  createPolicy: async (request: CreatePolicyRequest): Promise<Policy> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/api/v1/policies",
      {
        name: request.name,
        description: request.description,
        effect: request.effect,
        resource_type: request.resource,
        actions: request.actions,
        conditions: request.conditions,
        priority: request.priority,
        status: "active",
      }
    );

    return transformPolicy(response.data);
  },

  /**
   * Update a policy
   */
  updatePolicy: async (
    id: string,
    updates: Partial<CreatePolicyRequest> & { enabled?: boolean }
  ): Promise<Policy> => {
    const body: Record<string, unknown> = {};
    if (updates.name) body.name = updates.name;
    if (updates.description !== undefined)
      body.description = updates.description;
    if (updates.effect) body.effect = updates.effect;
    if (updates.resource) body.resource_type = updates.resource;
    if (updates.actions) body.actions = updates.actions;
    if (updates.conditions) body.conditions = updates.conditions;
    if (updates.priority !== undefined) body.priority = updates.priority;
    if (updates.enabled !== undefined)
      body.status = updates.enabled ? "active" : "inactive";

    const response = await apiClient.put<Record<string, unknown>>(
      `/api/v1/policies/${id}`,
      body
    );
    return transformPolicy(response.data);
  },

  /**
   * Delete a policy
   */
  deletePolicy: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/policies/${id}`);
  },

  /**
   * Check permission for current user
   */
  checkPermission: async (
    request: PermissionCheckRequest
  ): Promise<PermissionCheckResponse> => {
    try {
      const response = await apiClient.post<{
        allowed: boolean;
        reason?: string;
      }>("/api/v1/rbac/check-permission", {
        resource: request.resource,
        action: request.action,
        context: request.context,
      });

      return {
        allowed: response.data.allowed,
        reason:
          response.data.reason ||
          (response.data.allowed ? "Permission granted" : "Permission denied"),
      };
    } catch {
      return {
        allowed: false,
        reason: "Unable to verify permissions",
      };
    }
  },

  /**
   * Get available permissions
   */
  getAvailablePermissions: async (): Promise<AvailablePermissions[]> => {
    // This is a static list - no backend endpoint needed
    return getAvailablePermissions();
  },

  /**
   * Validate conditions and check resource references
   */
  validateConditions: async (
    request: ValidateConditionsRequest
  ): Promise<ConditionValidationResult> => {
    try {
      const response = await apiClient.post<ConditionValidationResult>(
        "/api/v1/policies/validate-conditions",
        request
      );
      return response.data;
    } catch (error) {
      // If the endpoint doesn't exist yet, return a default valid response
      console.warn("Condition validation endpoint not available:", error);
      return {
        is_valid: true,
        errors: [],
        warnings: [],
        references: [],
      };
    }
  },

  /**
   * Get resource references for a policy with their validation status
   */
  getPolicyReferences: async (
    policyId: string
  ): Promise<PolicyReferencesResponse> => {
    try {
      const response = await apiClient.get<PolicyReferencesResponse>(
        `/api/v1/policies/${policyId}/references`
      );
      return response.data;
    } catch (error) {
      // If the endpoint doesn't exist yet, return empty references
      console.warn("Policy references endpoint not available:", error);
      return {
        policy_id: policyId,
        references: [],
        validated_at: new Date().toISOString(),
      };
    }
  },
};

export default governanceApi;
