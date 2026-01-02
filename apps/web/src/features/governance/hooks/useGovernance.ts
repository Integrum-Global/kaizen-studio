import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { governanceApi } from "../api";
import type {
  RoleFilter,
  PolicyFilter,
  CreateRoleRequest,
  CreatePolicyRequest,
  PermissionCheckRequest,
  ResourceType,
  ActionType,
} from "../types";

/**
 * Query key factory for governance
 */
export const governanceKeys = {
  all: ["governance"] as const,
  roles: () => [...governanceKeys.all, "roles"] as const,
  roleList: (filters?: RoleFilter) =>
    [...governanceKeys.roles(), "list", filters] as const,
  roleDetail: (id: string) =>
    [...governanceKeys.roles(), "detail", id] as const,
  roleMembers: (roleId: string) =>
    [...governanceKeys.roles(), "members", roleId] as const,
  policies: () => [...governanceKeys.all, "policies"] as const,
  policyList: (filters?: PolicyFilter) =>
    [...governanceKeys.policies(), "list", filters] as const,
  policyDetail: (id: string) =>
    [...governanceKeys.policies(), "detail", id] as const,
  permissions: () => [...governanceKeys.all, "permissions"] as const,
  permissionCheck: (request: PermissionCheckRequest) =>
    [...governanceKeys.permissions(), "check", request] as const,
};

// ============ Role Hooks ============

/**
 * Hook to get all roles with optional filters
 */
export function useRoles(filters?: RoleFilter) {
  return useQuery({
    queryKey: governanceKeys.roleList(filters),
    queryFn: () => governanceApi.getRoles(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get a single role by ID
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: governanceKeys.roleDetail(id),
    queryFn: () => governanceApi.getRole(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateRoleRequest) =>
      governanceApi.createRole(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.roles() });
    },
  });
}

/**
 * Hook to update a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateRoleRequest>;
    }) => governanceApi.updateRole(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.roles() });
      queryClient.setQueryData(governanceKeys.roleDetail(data.id), data);
    },
  });
}

/**
 * Hook to delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => governanceApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.roles() });
    },
  });
}

/**
 * Hook to get role members
 */
export function useRoleMembers(roleId: string) {
  return useQuery({
    queryKey: governanceKeys.roleMembers(roleId),
    queryFn: () => governanceApi.getRoleMembers(roleId),
    enabled: !!roleId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to add member to role
 */
export function useAddRoleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      governanceApi.addRoleMember(roleId, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: governanceKeys.roleMembers(data.roleId),
      });
      queryClient.invalidateQueries({ queryKey: governanceKeys.roles() });
    },
  });
}

/**
 * Hook to remove member from role
 */
export function useRemoveRoleMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      governanceApi.removeRoleMember(roleId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: governanceKeys.roleMembers(variables.roleId),
      });
      queryClient.invalidateQueries({ queryKey: governanceKeys.roles() });
    },
  });
}

// ============ Policy Hooks ============

/**
 * Hook to get all policies with optional filters
 */
export function usePolicies(filters?: PolicyFilter) {
  return useQuery({
    queryKey: governanceKeys.policyList(filters),
    queryFn: () => governanceApi.getPolicies(filters),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to get a single policy by ID
 */
export function usePolicy(id: string) {
  return useQuery({
    queryKey: governanceKeys.policyDetail(id),
    queryFn: () => governanceApi.getPolicy(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new policy
 */
export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreatePolicyRequest) =>
      governanceApi.createPolicy(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.policies() });
    },
  });
}

/**
 * Hook to update a policy
 */
export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreatePolicyRequest> & { enabled?: boolean };
    }) => governanceApi.updatePolicy(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.policies() });
      queryClient.setQueryData(governanceKeys.policyDetail(data.id), data);
    },
  });
}

/**
 * Hook to delete a policy
 */
export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => governanceApi.deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceKeys.policies() });
    },
  });
}

// ============ Permission Hooks ============

/**
 * Hook to check permission
 */
export function usePermissionCheck(request: PermissionCheckRequest) {
  return useQuery({
    queryKey: governanceKeys.permissionCheck(request),
    queryFn: () => governanceApi.checkPermission(request),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to check if user can perform action
 */
export function useCanPerform(resource: ResourceType, action: ActionType) {
  return usePermissionCheck({ resource, action });
}

/**
 * Hook to get available permissions
 */
export function useAvailablePermissions() {
  return useQuery({
    queryKey: governanceKeys.permissions(),
    queryFn: () => governanceApi.getAvailablePermissions(),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });
}
