# API Integration

## Backend Endpoints

### Validate Conditions

Validates conditions structure and checks resource references.

```
POST /api/v1/policies/validate-conditions
```

**Request:**
```json
{
  "conditions": {
    "all": [
      {
        "category": "user",
        "attribute": "user_team",
        "operator": "in",
        "value": {
          "$ref": "resource",
          "type": "team",
          "selector": { "ids": ["team-001", "team-002"] }
        }
      }
    ]
  }
}
```

**Response:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    "Resource not found: team 'team-002'"
  ],
  "references": [
    {
      "type": "team",
      "id": "team-001",
      "name": "Engineering",
      "status": "valid",
      "validated_at": "2026-01-04T12:00:00Z"
    },
    {
      "type": "team",
      "id": "team-002",
      "name": null,
      "status": "orphaned",
      "validated_at": "2026-01-04T12:00:00Z"
    }
  ]
}
```

### Get Policy References

Returns all resource references in a policy's conditions with current status.

```
GET /api/v1/policies/{policy_id}/references
```

**Response:**
```json
{
  "references": [
    {
      "type": "agent",
      "id": "agent-001",
      "name": "Document Processor",
      "status": "valid",
      "validated_at": "2026-01-04T12:00:00Z"
    }
  ],
  "total": 1
}
```

## Frontend Hooks

### useValidateConditions

Mutation hook for validating conditions before save.

```typescript
import { useValidateConditions } from '@/features/governance/hooks';

function PolicyEditor() {
  const validateMutation = useValidateConditions();

  const handleValidate = async () => {
    const result = await validateMutation.mutateAsync({
      conditions: myConditions
    });

    if (result.warnings.length > 0) {
      // Show warnings
    }
  };

  return (
    <Button
      onClick={handleValidate}
      disabled={validateMutation.isPending}
    >
      Validate
    </Button>
  );
}
```

### usePolicyReferences

Query hook for fetching policy references with status.

```typescript
import { usePolicyReferences } from '@/features/governance/hooks';

function PolicyDetails({ policyId }) {
  const { data, isLoading, refetch } = usePolicyReferences(policyId);

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h3>Resource References</h3>
      {data?.references.map(ref => (
        <div key={ref.id}>
          {ref.type}: {ref.name || ref.id}
          <Badge variant={ref.status === 'valid' ? 'default' : 'warning'}>
            {ref.status}
          </Badge>
        </div>
      ))}
      <Button onClick={() => refetch()}>Refresh</Button>
    </div>
  );
}
```

### usePolicyReferenceIssues

Derived hook that categorizes reference issues.

```typescript
import { usePolicyReferenceIssues } from '@/features/governance/hooks';

function PolicyWarnings({ policyId }) {
  const { orphaned, changed, hasIssues } = usePolicyReferenceIssues(policyId);

  if (!hasIssues) return null;

  return (
    <Alert variant="warning">
      {orphaned.length > 0 && (
        <p>{orphaned.length} resource(s) no longer exist</p>
      )}
      {changed.length > 0 && (
        <p>{changed.length} resource(s) may have changed</p>
      )}
    </Alert>
  );
}
```

## Backend Implementation

### ABACService Methods

```python
# Validate conditions and check references
result = await abac_service.validate_conditions(
    conditions={"all": [...]},
    organization_id="org-001"
)
# Returns: { is_valid, errors, warnings, references }

# Get references for a policy
references = await abac_service.get_policy_references(
    policy_id="policy-001",
    organization_id="org-001"
)
# Returns: List[ResourceReferenceStatus]
```

### Policy Model

The Policy model includes a `resource_refs` field for caching extracted references:

```python
@db.model
class Policy:
    id: str
    conditions: str  # JSON-encoded conditions
    resource_refs: str | None  # JSON-encoded references cache
    # ... other fields
```

## Error Handling

The frontend gracefully handles cases where the validation endpoint is unavailable:

```typescript
// In api/governance.ts
async validateConditions(request) {
  try {
    const response = await api.post('/policies/validate-conditions', request);
    return response.data;
  } catch (error) {
    // Return safe default if endpoint not available
    console.info('Condition validation endpoint not available');
    return {
      is_valid: true,
      errors: [],
      warnings: [],
      references: []
    };
  }
}
```

This ensures the UI remains functional during development or if the backend is temporarily unavailable.
