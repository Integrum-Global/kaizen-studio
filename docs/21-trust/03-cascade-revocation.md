# Cascade Revocation

When an agent's trust is revoked, all downstream delegations must be revoked immediately.

## What It Is

Cascade revocation ensures trust cannot "orphan" in the system:

```
Human (Alice) → Manager → Worker A → Worker B
              ↳ Analyst
```

If Manager is revoked:
- Worker A is revoked (delegated from Manager)
- Worker B is revoked (delegated from Worker A)
- Analyst is revoked (delegated from Manager)

**All four agents lose trust in one operation.**

## Why It Matters

Without cascade revocation:
- Orphaned agents could act without valid authorization
- Revoked human's delegations would persist
- Compliance audit trail would be broken

EATP mandates: **No trust without traceable human origin.**

## How It Works

### Impact Preview

Before revoking, the system shows:
1. Count of affected agents
2. List with delegation depths
3. Active workload warnings
4. Critical warnings (if any)

### Confirmation Flow

1. Click "Revoke" on target agent
2. Modal shows cascade impact
3. Enter revocation reason
4. Type "REVOKE" to confirm
5. System revokes all affected agents

### Revoke by Human

When a human's access is revoked (employee leaves):
1. Call `/api/v1/trust/revoke/by-human/{humanId}`
2. System finds all agents with this human origin
3. Cascade revokes all of them

## Using the Modal

### With React Query Hooks (Recommended)

```tsx
import { CascadeRevocationModal, useRevokeCascade } from "@/features/trust";
import { getRevocationImpact } from "@/features/trust/api";

function RevocationButton({ agentId, agentName }) {
  const [open, setOpen] = useState(false);
  const revokeCascade = useRevokeCascade();

  const handleConfirm = async (reason: string) => {
    await revokeCascade.mutateAsync({ agentId, reason });
    // Cache is automatically invalidated by the hook
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Revoke
      </Button>
      <CascadeRevocationModal
        open={open}
        onOpenChange={setOpen}
        targetAgentId={agentId}
        targetAgentName={agentName}
        onConfirm={handleConfirm}
        loadImpact={getRevocationImpact}
      />
    </>
  );
}
```

### With Direct API Calls

```tsx
import { CascadeRevocationModal } from "@/features/trust";
import { getRevocationImpact, revokeCascade } from "@/features/trust/api";

function RevocationButton({ agentId, agentName }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async (reason: string) => {
    await revokeCascade(agentId, reason);
    // Handle success (refresh list, show toast, etc.)
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Revoke
      </Button>
      <CascadeRevocationModal
        open={open}
        onOpenChange={setOpen}
        targetAgentId={agentId}
        targetAgentName={agentName}
        onConfirm={handleConfirm}
        loadImpact={getRevocationImpact}
      />
    </>
  );
}
```

## Available Hooks

| Hook | Purpose |
|------|---------|
| `useRevocationImpact(agentId)` | Query impact preview |
| `useRevokeCascade()` | Mutation for cascade revocation |
| `useRevokeByHuman()` | Mutation to revoke all agents from a human |
| `useAuditByHumanOrigin(humanId)` | Query audit trail by human origin |

## API Endpoints

### Get Impact Preview

```
GET /api/v1/trust/revoke/{agentId}/impact
```

Response:
```json
{
  "targetAgentId": "agent-123",
  "targetAgentName": "Manager Agent",
  "affectedAgents": [
    {
      "agentId": "worker-a",
      "agentName": "Worker A",
      "delegationDepth": 1,
      "activeTasks": 3,
      "status": "valid"
    },
    {
      "agentId": "worker-b",
      "agentName": "Worker B",
      "delegationDepth": 2,
      "activeTasks": 0,
      "status": "valid"
    }
  ],
  "totalAffected": 2,
  "hasActiveWorkloads": true,
  "warnings": [
    "Worker A has 3 active tasks that will be interrupted"
  ]
}
```

### Revoke with Cascade

```
POST /api/v1/trust/revoke/{agentId}/cascade
Content-Type: application/json

{
  "reason": "Employee termination - Security protocol"
}
```

Response:
```json
{
  "revokedAgentIds": ["agent-123", "worker-a", "worker-b"],
  "totalRevoked": 3,
  "reason": "Employee termination - Security protocol",
  "initiatedBy": "admin@company.com",
  "completedAt": "2024-01-15T10:30:00Z"
}
```

### Revoke by Human

```
POST /api/v1/trust/revoke/by-human/{humanId}
Content-Type: application/json

{
  "reason": "Employee offboarding - HR request"
}
```

## Safety Features

### Impact Preview Required

The modal always loads impact preview before allowing confirmation.

### Confirmation Phrase

User must type exact phrase "REVOKE" to enable button.

### Reason Required

A reason must be provided for audit trail.

### Active Workload Warnings

If affected agents have active tasks, warnings are displayed prominently.

## Best Practices

1. **Review impact carefully** - Check delegation depths
2. **Notify stakeholders** - If agents have active workloads
3. **Provide clear reason** - For compliance audit
4. **Use revoke-by-human** - When employee leaves
5. **Set expiration on delegations** - Prefer time-limited access
