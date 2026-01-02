# Governance Features

Kaizen Studio implements a comprehensive governance system with Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) for fine-grained access management.

## Overview

The governance system provides:
- **Roles (RBAC)**: Define permission sets that can be assigned to users
- **Policies (ABAC)**: Create conditional access rules based on attributes
- **Audit Trail**: Track all permission and access changes

## Roles (RBAC)

Roles group permissions together for easy assignment to users or teams.

### Role Structure

Each role contains:
- **Name**: Unique identifier for the role
- **Description**: Purpose of the role
- **Permissions**: Set of resource/action pairs
- **System Flag**: Whether the role is a system-managed default

### Available Resources

Permissions can be defined for these resources:
- Agents
- Pipelines
- Deployments
- Gateways
- Teams
- Users
- Settings
- Billing
- Audit

### Available Actions

Each resource supports these actions:
- **Create**: Add new instances
- **Read**: View existing instances
- **Update**: Modify instances
- **Delete**: Remove instances
- **Execute**: Run or trigger (for agents/pipelines)
- **Manage**: Administrative actions
- **Admin**: Full administrative access

### Creating Roles

1. Navigate to **Admin → Roles**
2. Click **Create Role**
3. Enter role name and description
4. Select permissions by resource and action
5. Click **Create Role** to save

### Managing Roles

- **Search**: Filter roles by name
- **System Roles**: Toggle visibility of system-managed roles
- **Edit**: Modify role permissions
- **View Members**: See users assigned to the role
- **Delete**: Remove custom roles (system roles are protected)

## Policies (ABAC)

Policies enable fine-grained access control based on attributes and conditions.

### Policy Structure

Each policy includes:
- **Name**: Descriptive identifier
- **Effect**: Allow or Deny
- **Resource**: Target resource type
- **Actions**: Permitted/denied actions
- **Conditions**: Attribute-based rules
- **Priority**: Evaluation order (higher = first)

### Condition Operators

Policies support these condition operators:
- **Equals**: Exact match
- **Not Equals**: Inverse match
- **Contains**: Substring match
- **Not Contains**: Inverse substring
- **In**: Value in list
- **Not In**: Value not in list
- **Greater Than**: Numeric comparison
- **Less Than**: Numeric comparison

### Creating Policies

1. Navigate to **Admin → Policies**
2. Click **Create Policy**
3. Configure policy settings:
   - Name and description
   - Effect (Allow/Deny)
   - Target resource and actions
   - Priority level
4. Add conditions (optional)
5. Click **Create Policy** to save

### Policy Evaluation

Policies are evaluated in priority order:
1. Higher priority policies are checked first
2. First matching policy determines access
3. Explicit deny overrides allow
4. If no policy matches, access is denied by default

## Audit Trail

Access the audit log at **Observability → Audit** to track:
- Role assignments and changes
- Policy modifications
- Permission checks
- Access denials

## API Integration

### Check Permissions

```typescript
import { useCheckPermission } from '@/features/governance';

function MyComponent() {
  const { data: allowed } = useCheckPermission({
    resource: 'agent',
    action: 'create'
  });

  if (!allowed) {
    return <AccessDenied />;
  }

  return <CreateAgentButton />;
}
```

### Permission Gate Component

```tsx
import { PermissionGate } from '@/features/governance';

function AdminActions() {
  return (
    <PermissionGate resource="settings" action="manage">
      <SettingsPanel />
    </PermissionGate>
  );
}
```

## Best Practices

### Role Design

1. **Principle of Least Privilege**: Start with minimal permissions
2. **Role Hierarchy**: Create roles from general to specific
3. **Avoid Overlap**: Keep role boundaries clear
4. **Document Purpose**: Always describe what each role is for

### Policy Design

1. **Explicit Deny**: Use deny policies for sensitive resources
2. **Priority Management**: Set priorities carefully to avoid conflicts
3. **Test Conditions**: Verify condition logic before deployment
4. **Audit Regularly**: Review policies for accuracy

### Security Considerations

- System roles cannot be deleted
- Role changes are logged to audit
- Policy conflicts favor deny
- Regular access reviews recommended

## Routes

| Route | Description |
|-------|-------------|
| `/roles` | Role management page |
| `/policies` | ABAC policy management |
| `/audit` | Audit log and access history |

## Testing

Run governance E2E tests:
```bash
npx playwright test e2e/governance.spec.ts --project=chromium
```

Tests cover:
- Role creation and editing
- Policy creation with conditions
- Permission filtering
- Access control enforcement
- Responsive design
- Accessibility compliance
