# Agent Card Components (Phase 4 - A2A Agent Cards)

This module provides trust-aware agent card components for A2A (Agent-to-Agent) protocol integration. These components display trust information, enable trust-based search and filtering, and provide quick access to trust management actions.

## Components

### 1. AgentCardPreview

Trust-aware agent card preview showing complete agent information including trust status, capabilities, protocols, and endpoints.

**Props:**

- `agentId: string` - Agent ID to fetch trust information
- `className?: string` - Additional CSS classes
- `onViewTrustChain?: (agentId: string) => void` - Callback to view full trust chain

**Features:**

- Fetches agent trust data automatically using React Query
- Shows trust status badge prominently
- Displays trust chain summary (established by, expires at)
- Lists capabilities (collapsible if more than 5)
- Shows supported protocols as badges
- Displays active constraints with visual indicators
- Lists interaction endpoints with external links
- Loading skeleton for async data
- Error handling with user-friendly messages

**Usage:**

```tsx
import { AgentCardPreview } from "@/features/trust";

function AgentDetails({ agentId }: { agentId: string }) {
  const navigate = useNavigate();

  return (
    <AgentCardPreview
      agentId={agentId}
      onViewTrustChain={(id) => navigate(`/trust/chains/${id}`)}
    />
  );
}
```

### 2. AgentTrustBadge

Compact trust status badge for agent lists with tooltip and popover options.

**Props:**

- `agentId: string` - Agent ID to fetch trust summary
- `size?: "sm" | "md" | "lg"` - Badge size (default: "md")
- `showTooltip?: boolean` - Show tooltip with basic trust info (default: true)
- `showPopover?: boolean` - Show popover with detailed trust info (default: false)
- `onViewDetail?: (agentId: string) => void` - Callback when badge is clicked
- `className?: string` - Additional CSS classes

**Features:**

- Small, compact badge displaying trust status
- Optional tooltip showing authority, capability count, and expiration
- Optional popover showing detailed trust information
- Click-to-open trust details
- Loading skeleton
- Error handling

**Usage:**

```tsx
import { AgentTrustBadge } from "@/features/trust";

// Simple badge with tooltip
<AgentTrustBadge
  agentId="agent-123"
  size="sm"
  onViewDetail={(id) => navigate(`/agents/${id}`)}
/>

// Badge with detailed popover
<AgentTrustBadge
  agentId="agent-123"
  size="md"
  showPopover
  onViewDetail={(id) => navigate(`/agents/${id}`)}
/>
```

### 3. TrustAwareAgentSearch

Agent search with comprehensive trust filters including trust status, capabilities, constraints, and sorting options.

**Props:**

- `filters: AgentSearchFilters` - Current filter state
- `onFiltersChange: (filters: AgentSearchFilters) => void` - Callback when filters change
- `availableCapabilities?: string[]` - List of available capabilities for filtering
- `className?: string` - Additional CSS classes

**Filter Options:**

- **Search by name/ID**: Text search across agent names and IDs
- **Trust status**: Multi-select filter for VALID, EXPIRED, REVOKED, PENDING, INVALID
- **Capabilities**: Multi-select filter for specific capabilities
- **Constraints**: Filter by "has constraints" or "no constraints"
- **Sort by**: Name, trust expiration, or capability count
- **Sort order**: Ascending or descending

**Features:**

- Advanced filter popover with all filter options
- Active filters display with easy removal
- Clear all filters button
- Filter count badge
- Responsive design for mobile and desktop
- Preserves sort settings when clearing filters

**Usage:**

```tsx
import { TrustAwareAgentSearch, AgentSearchFilters } from "@/features/trust";

function AgentListPage() {
  const [filters, setFilters] = useState<AgentSearchFilters>({
    query: "",
    sort_by: "name",
    sort_order: "asc",
  });

  const capabilities = ["read:data", "write:data", "execute:tasks"];

  return (
    <TrustAwareAgentSearch
      filters={filters}
      onFiltersChange={setFilters}
      availableCapabilities={capabilities}
    />
  );
}
```

### 4. AgentTrustSummary

Inline trust summary for agent detail views showing trust status with icon, capability and constraint counts, expiration countdown, and quick actions.

**Props:**

- `agentId: string` - Agent ID to fetch trust summary
- `onViewChain?: (agentId: string) => void` - Callback to view trust chain
- `onDelegate?: (agentId: string) => void` - Callback to delegate trust
- `className?: string` - Additional CSS classes

**Features:**

- Trust status badge with icon
- Authority information
- Stats grid showing capability count, constraint count, and expiration
- Expiration warning if expiring within 7 days
- Last verification timestamp
- Quick action buttons for viewing trust chain and delegating trust
- Delegation button disabled if trust is not valid
- Loading skeleton
- Error handling

**Usage:**

```tsx
import { AgentTrustSummary } from "@/features/trust";

function AgentDetailView({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const [isDelegateOpen, setIsDelegateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <AgentTrustSummary
        agentId={agentId}
        onViewChain={(id) => navigate(`/trust/chains/${id}`)}
        onDelegate={(id) => setIsDelegateOpen(true)}
      />
      {/* Other agent details */}
    </div>
  );
}
```

## Types

### AgentWithTrust

Complete agent information with trust data:

```typescript
interface AgentWithTrust {
  id: string;
  name: string;
  trust_status: TrustStatus;
  trust_chain_id?: string;
  capabilities: string[];
  constraints: string[];
  protocols: string[];
  endpoints: Array<{ name: string; url: string }>;
  established_by?: string;
  expires_at?: string;
}
```

### AgentSearchFilters

Filter configuration for agent search:

```typescript
interface AgentSearchFilters {
  query: string;
  trust_status?: TrustStatus[];
  capabilities?: string[];
  has_constraints?: boolean;
  sort_by?: "name" | "trust_expiration" | "capability_count";
  sort_order?: "asc" | "desc";
}
```

## API Endpoints

These components expect the following backend API endpoints:

- `GET /api/v1/trust/agents/{agentId}/with-trust` - Fetch complete agent with trust information
- `GET /api/v1/trust/agents/{agentId}/trust-summary` - Fetch agent trust summary

## Integration Example

Here's a complete example integrating all agent card components:

```tsx
import {
  AgentCardPreview,
  AgentTrustBadge,
  TrustAwareAgentSearch,
  AgentTrustSummary,
  AgentSearchFilters,
} from "@/features/trust";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AgentDiscoveryPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AgentSearchFilters>({
    query: "",
    sort_by: "name",
    sort_order: "asc",
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <TrustAwareAgentSearch
        filters={filters}
        onFiltersChange={setFilters}
        availableCapabilities={["read:data", "write:data", "execute:tasks"]}
      />

      {/* Agent List with Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div key={agent.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{agent.name}</h3>
              <AgentTrustBadge
                agentId={agent.id}
                size="sm"
                showPopover
                onViewDetail={(id) => navigate(`/agents/${id}`)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentDetailPage({ agentId }: { agentId: string }) {
  const navigate = useNavigate();
  const [isDelegateOpen, setIsDelegateOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Trust Summary */}
      <div className="lg:col-span-1">
        <AgentTrustSummary
          agentId={agentId}
          onViewChain={(id) => navigate(`/trust/chains/${id}`)}
          onDelegate={(id) => setIsDelegateOpen(true)}
        />
      </div>

      {/* Right Column - Full Agent Details */}
      <div className="lg:col-span-2">
        <AgentCardPreview
          agentId={agentId}
          onViewTrustChain={(id) => navigate(`/trust/chains/${id}`)}
        />
      </div>
    </div>
  );
}
```

## Design Patterns

### Standalone Components

All components are designed to work standalone without requiring parent agent feature contexts. They accept an `agentId` prop and fetch trust data internally using React Query.

### Loading States

Every component includes a loading skeleton that matches its layout, ensuring consistent UX during data fetching.

### Error Handling

Components gracefully handle errors with clear error messages and appropriate fallback UI.

### Responsive Design

All components are responsive and work well on mobile and desktop breakpoints.

### Consistent Styling

Components use the same design tokens (colors, spacing, typography) as the rest of the trust feature for visual consistency.

## Dependencies

- React Query (`@tanstack/react-query`) for data fetching
- Shadcn/ui components (Badge, Button, Card, Tooltip, Popover, Checkbox, Input, Select, etc.)
- Lucide React for icons
- date-fns for date formatting
- Tailwind CSS for styling

## Related Components

- **AgentCardIntegration** - Original agent card integration components (AgentCardTrustSection, AgentTrustPreview, etc.)
- **TrustManagement** - Trust establishment, delegation, and revocation dialogs
- **TrustChainViewer** - Full trust chain visualization
- **TrustDashboard** - Trust analytics and monitoring

## Future Enhancements

- Real-time trust status updates via WebSocket
- Bulk trust operations for multiple agents
- Agent comparison view
- Trust status history timeline
- Export agent trust data
- Advanced search with saved filters
