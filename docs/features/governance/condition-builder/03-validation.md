# Validation and Reference Management

## Client-Side Validation

### useConditionValidation Hook

Validates individual conditions in real-time:

```typescript
import { useConditionValidation } from '@/features/governance/components/conditions';

function MyConditionRow({ condition }) {
  const validation = useConditionValidation(condition);

  return (
    <div>
      <ConditionInputs condition={condition} />
      {!validation.isValid && (
        <div className="text-red-500">
          {validation.errors.map(err => <p key={err}>{err}</p>)}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="text-yellow-500">
          {validation.warnings.map(warn => <p key={warn}>{warn}</p>)}
        </div>
      )}
    </div>
  );
}
```

### Validation Rules

| Value Type | Validation |
|------------|------------|
| Email | Valid email format |
| Email Domain | Valid domain format (no @ prefix) |
| IP Range | Valid IPv4 or CIDR notation |
| Time Range | startHour < endHour, at least one day selected |
| Number | Within min/max constraints |
| Resource Reference | Resource exists and is accessible |

### IP Address Validation

```typescript
import { isValidIpv4, isValidCidr, isValidIpOrCidr } from '@/features/governance/components/conditions';

isValidIpv4('192.168.1.1');      // true
isValidIpv4('256.1.1.1');        // false (octet > 255)
isValidCidr('192.168.0.0/24');   // true
isValidCidr('192.168.0.0/33');   // false (mask > 32)
isValidIpOrCidr('10.0.0.0/8');   // true
```

## Reference Management

### What are Resource References?

When a condition references a specific resource (agent, team, deployment), it creates a reference. If that resource is later deleted or renamed, the condition becomes orphaned or stale.

### Reference Structure

```typescript
interface ResourceReference {
  $ref: 'resource';
  type: 'agent' | 'team' | 'deployment' | 'gateway' | 'user' | 'workspace';
  selector: {
    id?: string;      // Single resource
    ids?: string[];   // Multiple resources
  };
  display: {
    name: string;
    names?: string[];
    status: 'valid' | 'orphaned' | 'changed';
    validatedAt: string;  // ISO timestamp
  };
}
```

### Reference Status

| Status | Meaning | Action |
|--------|---------|--------|
| `valid` | Resource exists and is current | None needed |
| `orphaned` | Resource was deleted | Update or remove condition |
| `changed` | Resource was renamed | Review and confirm |

### Detecting Reference Issues

#### On Component Mount
```typescript
import { usePolicyReferences } from '@/features/governance/hooks';

function PolicyEditor({ policyId }) {
  const { data: references, isLoading } = usePolicyReferences(policyId);

  const orphaned = references?.filter(r => r.status === 'orphaned');
  const changed = references?.filter(r => r.status === 'changed');

  if (orphaned?.length || changed?.length) {
    return <ReferenceWarnings references={references} />;
  }
}
```

#### Before Save
```typescript
import { useValidateConditions } from '@/features/governance/hooks';

function PolicyForm() {
  const validateConditions = useValidateConditions();

  const handleSave = async (conditions) => {
    const result = await validateConditions.mutateAsync({ conditions });

    if (result.warnings.length > 0) {
      // Show warning dialog
      const proceed = await confirmSave(result.warnings);
      if (!proceed) return;
    }

    // Continue with save
    await savePolicy(conditions);
  };
}
```

### ReferenceWarnings Component

Displays alerts for orphaned or changed resources:

```tsx
import { ReferenceWarnings } from '@/features/governance/components/conditions';

<ReferenceWarnings
  references={[
    { type: 'agent', id: 'agent-001', name: 'My Agent', status: 'orphaned' },
    { type: 'team', id: 'team-002', name: 'Engineering', status: 'changed' },
  ]}
  onDismiss={() => setShowWarnings(false)}
  onRefresh={() => refetchReferences()}
/>
```

## Pre-Save Validation Flow

1. User clicks "Save Policy"
2. Frontend calls `POST /api/v1/policies/validate-conditions`
3. Backend extracts resource references from conditions
4. Backend validates each reference exists
5. Returns validation result with warnings
6. If warnings exist, show confirmation dialog
7. User can "Go Back & Fix" or "Save Anyway"
8. Policy saved with current reference status
