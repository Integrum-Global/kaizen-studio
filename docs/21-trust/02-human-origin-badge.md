# Human Origin Badge

Visual component that displays who authorized an agent action.

## What It Is

The Human Origin Badge answers the question: **"Who is responsible for this?"**

It shows:
- The human's initials in an avatar
- Their authentication provider
- When they authenticated
- Link to full trust chain

## Why It Matters

EATP requires every action to trace to a human. The badge makes this visible:

- **Audit records**: See who authorized each action
- **Delegation cards**: See the human at the root
- **Trust chain viewer**: Trace back to origin
- **Compliance reports**: Human-readable accountability

## How to Use

### Basic Usage

```tsx
import { HumanOriginBadge } from "@/features/trust/components/HumanOriginBadge";

// In an audit event card
<HumanOriginBadge humanOrigin={auditAnchor.human_origin} />

// With full details visible
<HumanOriginBadge
  humanOrigin={delegation.human_origin}
  showDetails
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `humanOrigin` | `HumanOrigin \| null` | required | The human origin data |
| `showDetails` | `boolean` | `false` | Show name and email inline |
| `showProvider` | `boolean` | `true` | Show auth provider icon |
| `showTimestamp` | `boolean` | `false` | Show relative time |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Avatar size |

### Variants

**Compact (default)**
- Avatar with initials
- Auth provider icon
- Tooltip with full details on hover

**Expanded (`showDetails`)**
- Avatar with initials
- Name and email visible
- Auth provider icon
- Optional timestamp

**Legacy Records**
- Shows "Legacy" badge
- Indicates pre-EATP record
- No human origin to display

## Auth Provider Icons

| Provider | Icon | Color |
|----------|------|-------|
| Okta | Shield | Blue |
| Azure AD | Building | Sky |
| Google | Shield | Red |
| SAML | Shield | Purple |
| OIDC | Shield | Green |
| LDAP | Building | Yellow |
| Session | User | Gray |

## Integration Points

### Audit Trail Viewer

```tsx
// In AuditEventCard.tsx
<div className="flex items-center gap-2">
  <span className="text-sm">Authorized by:</span>
  <HumanOriginBadge humanOrigin={event.human_origin} />
</div>
```

### Delegation Cards

```tsx
// In DelegationCard.tsx
<div className="flex items-center justify-between">
  <span>Root authority:</span>
  <HumanOriginBadge
    humanOrigin={delegation.human_origin}
    showDetails
  />
</div>
```

### Trust Chain Graph

```tsx
// In TrustChainNode.tsx (React Flow)
{node.type === "human" && (
  <HumanOriginBadge
    humanOrigin={node.data.humanOrigin}
    showDetails
    size="lg"
  />
)}
```

## Accessibility

- Avatar has `aria-label` with human's name
- Tooltip content is keyboard accessible
- Auth provider icons have descriptive labels
- Color is not sole indicator (icons differ)

## Data Structure

```typescript
interface HumanOrigin {
  humanId: string;         // "alice@company.com"
  displayName: string;     // "Alice Chen"
  authProvider: AuthProvider; // "okta"
  sessionId: string;       // For correlation
  authenticatedAt: string; // ISO 8601
}
```
