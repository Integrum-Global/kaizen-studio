# Governance Feature (RBAC/ABAC)

The Governance feature provides Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) for managing permissions and policies.

## Feature Location

```
src/features/governance/
├── types/
│   └── governance.ts       # Type definitions
├── api/
│   └── governance.ts       # API client
├── hooks/
│   └── useGovernance.ts    # React Query hooks
├── components/
│   ├── PermissionGate.tsx  # Conditional rendering by permission
│   ├── PermissionDenied.tsx # Access denied view
│   ├── RoleCard.tsx        # Role display card
│   ├── RoleList.tsx        # Filterable role list
│   ├── RoleEditor.tsx      # Create/edit roles
│   ├── RoleMembers.tsx     # Manage role members
│   ├── PolicyCard.tsx      # Policy display card
│   ├── PolicyList.tsx      # Filterable policy list
│   ├── PolicyEditor.tsx    # Create/edit policies
│   └── GovernanceDashboard.tsx # Main dashboard
└── index.ts                # Barrel exports
```

## Types

### Permission
```typescript
interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  description?: string;
}

type ResourceType =
  | 'agent' | 'pipeline' | 'deployment' | 'gateway'
  | 'team' | 'user' | 'settings' | 'billing' | 'audit';

type ActionType =
  | 'create' | 'read' | 'update' | 'delete'
  | 'execute' | 'manage' | 'admin';
```

### Role
```typescript
interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Policy (ABAC)
```typescript
interface Policy {
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

type PolicyEffect = 'allow' | 'deny';

interface PolicyCondition {
  id: string;
  attribute: string;
  operator: ConditionOperator;
  value: string | string[];
}
```

## Hooks

| Hook | Description |
|------|-------------|
| `useRoles(filters?)` | List roles with filtering |
| `useRole(id)` | Get single role |
| `useCreateRole()` | Create new role |
| `useUpdateRole()` | Update role |
| `useDeleteRole()` | Delete role |
| `useRoleMembers(roleId)` | Get role members |
| `useAddRoleMember()` | Add member to role |
| `useRemoveRoleMember()` | Remove member from role |
| `usePolicies(filters?)` | List policies |
| `usePolicy(id)` | Get single policy |
| `useCreatePolicy()` | Create policy |
| `useUpdatePolicy()` | Update policy |
| `useDeletePolicy()` | Delete policy |
| `usePermissionCheck()` | Check permission |
| `useAvailablePermissions()` | Get all permissions |
| `useCanPerform(resource, action)` | Check if user can perform action |

## Components

### PermissionGate
Conditionally render content based on permissions.

```tsx
import { PermissionGate } from '@/features/governance';

// Single permission check
<PermissionGate resource="agent" action="create">
  <CreateAgentButton />
</PermissionGate>

// Multiple permissions (require all)
<PermissionGate
  permissions={[
    { resource: 'agent', action: 'create' },
    { resource: 'pipeline', action: 'create' },
  ]}
  requireAll
>
  <AdminPanel />
</PermissionGate>

// With fallback
<PermissionGate resource="billing" action="manage" fallback={<UpgradePrompt />}>
  <BillingSettings />
</PermissionGate>
```

### RoleList
Filterable list of roles.

```tsx
import { RoleList } from '@/features/governance';

<RoleList
  onViewDetails={(role) => navigate(`/governance/roles/${role.id}`)}
  onEdit={(role) => setEditRole(role)}
  onDelete={(role) => confirmDelete(role)}
/>
```

### RoleEditor
Create or edit roles with permission selection.

```tsx
import { RoleEditor } from '@/features/governance';

<RoleEditor
  role={editingRole}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => refetchRoles()}
/>
```

### PolicyList
Filterable list of ABAC policies.

```tsx
import { PolicyList } from '@/features/governance';

<PolicyList
  onViewDetails={(policy) => navigate(`/governance/policies/${policy.id}`)}
  onEdit={(policy) => setEditPolicy(policy)}
  onDelete={(policy) => confirmDelete(policy)}
/>
```

### PolicyEditor
Create or edit policies with condition builder.

```tsx
import { PolicyEditor } from '@/features/governance';

<PolicyEditor
  policy={editingPolicy}
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => refetchPolicies()}
/>
```

## RBAC vs ABAC

### RBAC (Roles)
- Assign users to roles
- Roles have fixed permissions
- Simple permission model
- Good for basic access control

### ABAC (Policies)
- Define fine-grained rules
- Use conditions with attributes
- Dynamic permission evaluation
- Good for complex access control

Example ABAC policy:
```json
{
  "name": "Production Deployment Restriction",
  "effect": "deny",
  "resource": "deployment",
  "actions": ["create", "update"],
  "conditions": [
    { "attribute": "environment", "operator": "equals", "value": "production" },
    { "attribute": "user.role", "operator": "not_equals", "value": "admin" }
  ],
  "priority": 100
}
```

## System Roles

System roles cannot be modified or deleted:
- **Administrator**: Full system access
- **Developer**: Create and manage agents/pipelines
- **Viewer**: Read-only access
- **Operator**: Deploy and manage applications
