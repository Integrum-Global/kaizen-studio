# Agent Card Trust Integration (Phase 4 - A2A)

This module provides trust information components designed to be embedded in Agent Cards (A2A protocol). These components work standalone and can be integrated into any agent-related feature.

## Components

### 1. TrustBadgeWithTooltip

Reusable trust badge with enhanced tooltip showing trust status, authority, expiration, and quick stats.

**Props:**

- `status: TrustStatus` - Trust status (VALID, EXPIRED, REVOKED, PENDING, INVALID)
- `authorityName?: string` - Name of the authority that granted trust
- `authorityType?: AuthorityType` - Type of authority (ORGANIZATION, SYSTEM, HUMAN)
- `expiresAt?: string | null` - ISO 8601 expiration date
- `capabilityCount?: number` - Number of capabilities
- `constraintCount?: number` - Number of constraints
- `size?: "xs" | "sm" | "md"` - Badge size
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
<TrustBadgeWithTooltip
  status={TrustStatus.VALID}
  authorityName="Acme Corp"
  authorityType={AuthorityType.ORGANIZATION}
  capabilityCount={5}
  size="sm"
/>
```

### 2. AgentCardTrustSection

Trust information section for agent cards showing status badge, authority, expiration with countdown, capability count, and link to full trust chain viewer.

**Props:**

- `agentId: string` - Agent ID to fetch trust information
- `compact?: boolean` - Compact mode for embedded use (default: false)
- `onViewChain?: (agentId: string) => void` - Callback to view full trust chain
- `className?: string` - Additional CSS classes

**Features:**

- Fetches trust data automatically using `useAgentTrustSummary` hook
- Shows expiration warning if expiring within 7 days
- Loading skeleton for async data
- Error handling with retry
- Compact mode shows inline badge and capability count
- Full mode shows detailed card with all trust information

**Usage:**

```tsx
// Compact mode (for agent card embedding)
<AgentCardTrustSection
  agentId="agent-123"
  compact
  onViewChain={(agentId) => navigate(`/trust/chains/${agentId}`)}
/>

// Full mode (standalone)
<AgentCardTrustSection
  agentId="agent-123"
  onViewChain={(agentId) => navigate(`/trust/chains/${agentId}`)}
/>
```

### 3. TrustCapabilityList

Displays agent's capabilities from trust chain with capability type badges, constraint indicators, and collapsible view for more than 5 capabilities.

**Props:**

- `agentId: string` - Agent ID to fetch capabilities
- `maxVisible?: number` - Maximum visible capabilities before collapsing (default: 5)
- `className?: string` - Additional CSS classes

**Features:**

- Fetches capability data using `useAgentCapabilitySummary` hook
- Shows capability type badges (ACCESS, ACTION, DELEGATION)
- Displays constraint count per capability
- Indicates expired capabilities with strikethrough
- Collapsible view for long lists
- Loading skeleton

**Usage:**

```tsx
<TrustCapabilityList agentId="agent-123" maxVisible={5} />
```

### 4. AgentTrustPreview

Hover/click preview showing quick view of agent's trust status, top capabilities, constraints summary, and link to full trust chain viewer.

**Props:**

- `agentId: string` - Agent ID to fetch trust information
- `agentName?: string` - Optional agent name to display
- `maxCapabilities?: number` - Maximum capabilities to show (default: 5)
- `onViewChain?: (agentId: string) => void` - Callback to view full trust chain
- `className?: string` - Additional CSS classes

**Features:**

- Fetches trust and capability data automatically
- Shows top N capabilities
- Displays authority and constraint summary
- Fixed width (320px) for consistent popover sizing
- Loading skeleton

**Usage:**

```tsx
// In a popover or hover state
<Popover>
  <PopoverTrigger>Agent Name</PopoverTrigger>
  <PopoverContent>
    <AgentTrustPreview
      agentId="agent-123"
      agentName="Assistant Agent"
      onViewChain={(agentId) => navigate(`/trust/chains/${agentId}`)}
    />
  </PopoverContent>
</Popover>
```

### 5. AgentTrustActions

Quick actions for agent trust management with loading states and error handling.

**Props:**

- `agentId: string` - Agent ID for trust actions
- `onEstablishTrust?: (agentId: string) => void` - Callback to establish trust
- `onDelegateTrust?: (agentId: string) => void` - Callback to delegate trust
- `onRevokeTrust?: (agentId: string) => void` - Callback to revoke trust
- `compact?: boolean` - Compact mode uses dropdown menu (default: false)
- `className?: string` - Additional CSS classes

**Actions:**

- **Establish Trust**: Shows if no trust exists (requires callback)
- **Delegate Trust**: Shows if has valid trust (requires callback)
- **Revoke Trust**: Shows if has valid/expired trust (built-in or callback)
- **Verify Trust**: Always available, uses `useVerifyTrust` hook

**Features:**

- Built-in verify trust with toast notifications
- Optional built-in revoke trust
- Loading states for async actions
- Error handling with toast notifications
- Compact mode uses dropdown menu
- Full mode uses button stack

**Usage:**

```tsx
// Compact mode (dropdown)
<AgentTrustActions
  agentId="agent-123"
  compact
  onEstablishTrust={(agentId) => openEstablishDialog(agentId)}
  onDelegateTrust={(agentId) => openDelegateWizard(agentId)}
/>

// Full mode (button stack)
<AgentTrustActions
  agentId="agent-123"
  onEstablishTrust={(agentId) => openEstablishDialog(agentId)}
  onDelegateTrust={(agentId) => openDelegateWizard(agentId)}
  onRevokeTrust={(agentId) => openRevokeDialog(agentId)}
/>
```

## API Functions

### getAgentTrustSummary(agentId: string): Promise<AgentTrustSummary>

Fetches agent trust summary for agent card display.

**Returns:**

```typescript
interface AgentTrustSummary {
  agentId: string;
  agentName?: string;
  status: TrustStatus;
  authorityName: string;
  authorityType: AuthorityType;
  capabilityCount: number;
  constraintCount: number;
  expiresAt: string | null;
  isExpiringSoon: boolean;
  verifiedAt: string | null;
}
```

### getAgentCapabilitySummary(agentId: string): Promise<AgentCapabilitySummary[]>

Fetches agent capability summary for agent card display.

**Returns:**

```typescript
interface AgentCapabilitySummary {
  type: CapabilityType;
  name: string;
  constraintCount: number;
  isExpired: boolean;
}
```

## React Hooks

### useAgentTrustSummary(agentId: string)

React Query hook to fetch agent trust summary.

**Returns:** `UseQueryResult<AgentTrustSummary>`

### useAgentCapabilitySummary(agentId: string)

React Query hook to fetch agent capability summary.

**Returns:** `UseQueryResult<AgentCapabilitySummary[]>`

## Integration Example

Here's a complete example of integrating trust information into an agent card:

```tsx
import {
  AgentCardTrustSection,
  AgentTrustActions,
  TrustCapabilityList,
} from "@/features/trust";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

function AgentCard({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <h3>{agentName}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Trust Status Section */}
        <AgentCardTrustSection
          agentId={agentId}
          compact={false}
          onViewChain={(id) => navigate(`/trust/chains/${id}`)}
        />

        {/* Capabilities List */}
        <TrustCapabilityList agentId={agentId} maxVisible={3} />
      </CardContent>

      <CardFooter>
        {/* Trust Actions */}
        <AgentTrustActions
          agentId={agentId}
          compact
          onEstablishTrust={(id) => openEstablishDialog(id)}
          onDelegateTrust={(id) => openDelegateWizard(id)}
        />
      </CardFooter>
    </Card>
  );
}
```

## Design Patterns

### Standalone Components

All components are designed to work standalone without depending on parent agent features. They accept an `agentId` prop and fetch trust data internally.

### Loading States

Every component has a loading skeleton that matches its layout, ensuring consistent UX during data fetching.

### Error Handling

Components gracefully handle errors with clear error messages and retry mechanisms where appropriate.

### Responsive Design

All components are responsive and work well on mobile and desktop breakpoints.

### Consistent Styling

Components use the same design tokens (colors, spacing, typography) as the rest of the trust feature for consistency.

## Dependencies

- React Query (`@tanstack/react-query`) for data fetching
- Shadcn/ui components (Badge, Button, Card, Tooltip, Collapsible, etc.)
- Lucide React for icons
- date-fns for date formatting
- Tailwind CSS for styling

## Backend API Endpoints

These components expect the following backend API endpoints:

- `GET /api/v1/trust/agents/{agentId}/trust-summary` - Agent trust summary
- `GET /api/v1/trust/agents/{agentId}/capability-summary` - Agent capability summary
- `POST /api/v1/trust/verify` - Verify trust for action
- `POST /api/v1/trust/revoke` - Revoke trust

## Future Enhancements

- Real-time trust status updates via WebSocket
- Trust status change notifications
- Bulk trust actions for multiple agents
- Trust comparison between agents
- Trust history timeline
