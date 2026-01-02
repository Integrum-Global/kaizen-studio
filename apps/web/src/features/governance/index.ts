// Types
export type {
  ResourceType,
  ActionType,
  PolicyEffect,
  ConditionOperator,
  Permission,
  Role,
  PolicyCondition,
  Policy,
  RoleMember,
  PermissionCheckRequest,
  PermissionCheckResponse,
  RoleFilter,
  PolicyFilter,
  RolesResponse,
  PoliciesResponse,
  CreateRoleRequest,
  CreatePolicyRequest,
  AvailablePermissions,
} from "./types";

// API
export { governanceApi } from "./api";

// Hooks
export {
  governanceKeys,
  // Role hooks
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useRoleMembers,
  useAddRoleMember,
  useRemoveRoleMember,
  // Policy hooks
  usePolicies,
  usePolicy,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  // Permission hooks
  usePermissionCheck,
  useCanPerform,
  useAvailablePermissions,
} from "./hooks";

// Components
export {
  PermissionGate,
  PermissionDenied,
  withPermission,
} from "./components/PermissionGate";
export { RoleCard } from "./components/RoleCard";
export { RoleList } from "./components/RoleList";
export { RoleEditor } from "./components/RoleEditor";
export { RoleMembers } from "./components/RoleMembers";
export { PolicyCard } from "./components/PolicyCard";
export { PolicyList } from "./components/PolicyList";
export { PolicyEditor } from "./components/PolicyEditor";
export { GovernanceDashboard } from "./components/GovernanceDashboard";
