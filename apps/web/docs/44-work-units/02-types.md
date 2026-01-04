# Work Unit Types

Type definitions for the Work Units feature.

## Core Types

### WorkUnitType

```typescript
type WorkUnitType = 'atomic' | 'composite';
```

### UserLevel

Three-level access control:

```typescript
type UserLevel = 1 | 2 | 3;
```

| Level | Role | Permissions |
|-------|------|-------------|
| 1 | Task Performer | Run assigned tasks |
| 2 | Process Owner | Create and manage work units |
| 3 | Value Chain Owner | Full control, establish trust |

### Capability

Defines what a work unit can do:

```typescript
interface Capability {
  id: string;
  name: string;
  description: string;
  type: 'access' | 'action' | 'delegation';
  constraints: Constraint[];
}
```

**Capability Types:**
- `access` - Read or access data/resources
- `action` - Perform operations or modifications
- `delegation` - Delegate tasks to other units

### TrustSetupOption

Initial trust configuration:

```typescript
type TrustSetupOption =
  | 'establish'  // Level 3 only: Establish trust directly
  | 'delegate'   // Level 2+: Request delegation
  | 'skip';      // Save as pending trust
```

## Form Types

### CreateWorkUnitFormData

Complete form data for wizard:

```typescript
interface CreateWorkUnitFormData {
  // Step 1: Type
  type: WorkUnitType;

  // Step 2: Basic Info
  name: string;
  description: string;

  // Step 3: Capabilities
  capabilities: Capability[];

  // Step 4: Configuration
  workspaceId?: string;
  tags: string[];

  // Step 5: Trust Setup
  trustSetup: TrustSetupOption;
  delegateeId?: string;
}
```

### Default Form Data

```typescript
const defaultFormData: CreateWorkUnitFormData = {
  type: 'atomic',
  name: '',
  description: '',
  capabilities: [],
  workspaceId: undefined,
  tags: [],
  trustSetup: 'skip',
  delegateeId: undefined,
};
```

## Component Props

### StepProps

Base props for step components:

```typescript
interface StepProps {
  formData: CreateWorkUnitFormData;
  onChange: (updates: Partial<CreateWorkUnitFormData>) => void;
  errors?: Record<string, string>;
}
```

### WizardStep

Step metadata for navigation:

```typescript
interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}
```

## Reference Types

### WorkspaceRef

Workspace reference for config step:

```typescript
interface WorkspaceRef {
  id: string;
  name: string;
  color: string;
}
```

### Delegatee

User available for trust delegation:

```typescript
interface Delegatee {
  id: string;
  name: string;
  level: UserLevel;
}
```

## Presets

### Capability Presets

Built-in capability templates:

```typescript
const CAPABILITY_PRESETS = [
  { id: 'extract', name: 'Extract', type: 'access' },
  { id: 'validate', name: 'Validate', type: 'action' },
  { id: 'transform', name: 'Transform', type: 'action' },
  { id: 'classify', name: 'Classify', type: 'action' },
  { id: 'route', name: 'Route', type: 'action' },
  { id: 'archive', name: 'Archive', type: 'action' },
  { id: 'notify', name: 'Notify', type: 'action' },
  { id: 'approve', name: 'Approve', type: 'action' },
];
```

## API Types

### CreateWorkUnitInput

API input for creating work units:

```typescript
interface CreateWorkUnitInput {
  type: WorkUnitType;
  name: string;
  description: string;
  capabilities: Capability[];
  workspaceId?: string;
  tags?: string[];
  trustSetup?: TrustSetupOption;
  delegateeId?: string;
}
```

### UpdateWorkUnitInput

API input for updating work units:

```typescript
interface UpdateWorkUnitInput {
  name?: string;
  description?: string;
  capabilities?: Capability[];
  workspaceId?: string | null;
  tags?: string[];
}
```
