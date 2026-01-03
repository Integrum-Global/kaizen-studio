# Trust & Human Accountability

Enterprise Agent Trust Protocol (EATP) ensures every agent action traces back to a human who authorized it.

## Core Concept

**Every agent action must be traceable to a human.**

When an agent reads a database, sends an email, or makes an API call, EATP answers:
- Who authorized this action?
- Through what delegation chain?
- Under what constraints?

## Key Elements

### Human Origin

The `HumanOrigin` is the starting point of all trust. It represents:
- **Who**: The authenticated human (email, display name)
- **How**: Authentication provider (Okta, Azure AD, etc.)
- **When**: Authentication timestamp
- **Session**: For correlation and revocation

```
Human (Alice) → PseudoAgent → Manager Agent → Worker Agent → Action
       ↑
   HumanOrigin is preserved through the entire chain
```

### Trust Lineage Chain

The cryptographic proof of authorization:
1. **Genesis Record**: How the agent was authorized to exist
2. **Capability Attestations**: What the agent can do
3. **Delegation Records**: How trust was transferred
4. **Constraint Envelope**: Accumulated restrictions
5. **Audit Anchors**: What the agent did

### Constraint Tightening

Delegations can only **reduce** permissions, never expand them:
- Manager has $10,000 cost limit → Worker can have ≤$10,000
- Manager can access `invoices/*` → Worker can access subset only
- Constraints merge and accumulate through delegation

## UI Components

### Human Origin Badge

Shows who authorized an action at a glance:
- Avatar with initials
- Auth provider icon (Okta, Azure AD, etc.)
- Tooltip with full details
- "Legacy" badge for pre-EATP records

### Cascade Revocation Modal

When revoking trust, shows full impact:
- Count of affected agents
- Delegation tree visualization
- Active workload warnings
- Requires confirmation phrase

### Trust Chain Viewer

Visualizes the complete trust lineage:
- From human through all delegations
- Constraint accumulation at each level
- Expiration tracking

## Usage

### Establishing Trust

1. User authenticates (SSO)
2. System creates PseudoAgent for user
3. User delegates to agent with capabilities and constraints
4. Agent can now act on user's behalf

### Delegating Trust

1. Agent A has capabilities from user
2. Agent A delegates subset to Agent B
3. Constraints must be equal or tighter
4. Human origin preserved through chain

### Revoking Trust

1. Select agent to revoke
2. System shows cascade impact preview
3. Enter reason and confirm
4. All downstream agents revoked immediately

### Auditing

Every action records:
- Agent that performed it
- Human who authorized (via delegation chain)
- Constraints that were active
- Result (success, denied, error)

Query audit by:
- Agent ID
- Human origin (who authorized)
- Time range
- Action type

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/trust/revoke/{id}/impact` | Preview cascade impact |
| `POST /api/v1/trust/revoke/{id}/cascade` | Revoke with cascade |
| `POST /api/v1/trust/revoke/by-human/{id}` | Revoke all from human |
| `GET /api/v1/trust/audit/by-human/{id}` | Audit by human origin |

## Best Practices

1. **Always include human origin** in new delegations
2. **Review impact** before cascade revocation
3. **Use constraint tightening** to limit agent scope
4. **Audit regularly** by human origin for compliance
5. **Set expiration** on delegations for time-limited access
