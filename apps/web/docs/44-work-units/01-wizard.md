# WorkUnitCreateWizard

A multi-step wizard for creating new work units. Guides users through type selection, basic information, capabilities definition, configuration, and trust setup.

## Access

The wizard is available to **Level 2+** users via the "New Work Unit" button on the Work Units page.

## Steps

### Step 1: Type Selection

Choose between Atomic or Composite work unit:

- **Atomic** - Single, indivisible task
- **Composite** - Orchestrates multiple work units

```tsx
// TypeStep displays radio options
<TypeStep formData={formData} onChange={onChange} errors={errors} />
```

### Step 2: Basic Information

Enter name and description:

- **Name** - 3-100 characters, required
- **Description** - 10-500 characters, required

```tsx
<InfoStep formData={formData} onChange={onChange} errors={errors} />
```

### Step 3: Capabilities

Define what the work unit can do:

**Capability Types:**
- `access` - Read or access data/resources
- `action` - Perform operations or modifications
- `delegation` - Delegate tasks to other units

**Built-in Presets:**
- Extract, Validate, Transform, Classify
- Route, Archive, Notify, Approve

```tsx
<CapabilitiesStep formData={formData} onChange={onChange} errors={errors} />
```

### Step 4: Configuration

Optional organizational settings:

- **Workspace** - Assign to a workspace
- **Tags** - Add searchable tags (lowercase, deduplicated)

```tsx
<ConfigStep
  formData={formData}
  onChange={onChange}
  errors={errors}
  workspaces={workspaces}
/>
```

### Step 5: Trust Setup

Configure initial trust based on user level:

| User Level | Available Options |
|------------|-------------------|
| Level 3 | Establish Now, Delegate, Skip |
| Level 2 | Delegate, Skip |

**Trust Options:**
- **Establish Now** (L3 only) - Work unit is immediately ready to run
- **Delegate** - Request trust from another user
- **Skip** - Create with pending trust, configure later

```tsx
<TrustStep
  formData={formData}
  onChange={onChange}
  errors={errors}
  userLevel={userLevel}
  delegatees={delegatees}
/>
```

## Usage

### Basic Integration

```tsx
import { WorkUnitCreateWizard } from '@/features/work-units';
import { useCreateWorkUnit } from '@/features/work-units/hooks';

function WorkUnitsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const createMutation = useCreateWorkUnit();

  const handleSubmit = async (data: CreateWorkUnitFormData) => {
    await createMutation.mutateAsync({
      type: data.type,
      name: data.name,
      description: data.description,
      capabilities: data.capabilities,
      workspaceId: data.workspaceId,
      tags: data.tags,
      trustSetup: data.trustSetup,
      delegateeId: data.delegateeId,
    });
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>New Work Unit</Button>
      <WorkUnitCreateWizard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        userLevel={2}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
```

### With Workspaces and Delegatees

```tsx
import { useWorkspaces, useDelegatees } from '@/features/work-units/hooks';

function WorkUnitsPage() {
  const { data: workspaces } = useWorkspaces();
  const { data: delegatees } = useDelegatees();

  return (
    <WorkUnitCreateWizard
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      userLevel={userLevel}
      workspaces={workspaces}
      delegatees={delegatees}
      isSubmitting={isPending}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls dialog visibility |
| `onClose` | `() => void` | Yes | Called when dialog closes |
| `onSubmit` | `(data) => Promise<void>` | Yes | Called with form data on submit |
| `userLevel` | `1 \| 2 \| 3` | Yes | Current user's level |
| `workspaces` | `WorkspaceRef[]` | No | Available workspaces |
| `delegatees` | `Delegatee[]` | No | Users available for delegation |
| `isSubmitting` | `boolean` | No | Shows loading state |

## Form Data

```typescript
interface CreateWorkUnitFormData {
  type: 'atomic' | 'composite';
  name: string;
  description: string;
  capabilities: Capability[];
  workspaceId?: string;
  tags: string[];
  trustSetup: 'establish' | 'delegate' | 'skip';
  delegateeId?: string;
}
```

## Validation

Validation occurs per-step and on final submission:

| Step | Field | Rule |
|------|-------|------|
| Type | type | Required |
| Info | name | Required, 3-100 chars |
| Info | description | Required, 10-500 chars |
| Capabilities | capabilities | At least 1 required |
| Trust | delegateeId | Required if trustSetup is 'delegate' |

## Navigation

- **Step Indicator** - Click visited steps to navigate back
- **Back/Next** - Move between adjacent steps
- **Cancel** - Close wizard and reset form
- **Create** - Submit on final step

## Test IDs

For E2E testing:

| Element | Test ID |
|---------|---------|
| Step buttons | `wizard-step-{type\|info\|capabilities\|config\|trust}` |
| Content area | `wizard-content` |
| Back button | `wizard-back-btn` |
| Next button | `wizard-next-btn` |
| Submit button | `wizard-submit-btn` |
| Workspace select | `wizard-workspace-select` |
| Tag input | `wizard-tag-input` |
| Add tag button | `add-tag-btn` |
| Delegatee select | `wizard-delegatee-select` |
