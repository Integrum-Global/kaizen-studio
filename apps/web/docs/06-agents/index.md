# Agent Designer

The Agent Designer provides a comprehensive UI for managing Kaizen AI agents. It includes listing, creating, editing, and configuring agents with their pipelines.

## Components

### AgentList

Displays all agents in a searchable, filterable grid layout.

```tsx
import { AgentList } from '@/features/agents/components/AgentList';

// Usage in a page
export function AgentsPage() {
  return <AgentList />;
}
```

Features:
- Search by agent name/description
- Filter by status (active, inactive, draft)
- Grid view with agent cards
- Pagination support
- Loading skeletons
- Empty state handling

### AgentCard

Displays individual agent information in a card format.

```tsx
import { AgentCard } from '@/features/agents/components/AgentCard';
import type { Agent } from '@/features/agents/types';

const agent: Agent = {
  id: 'agent-123',
  name: 'Customer Support Agent',
  description: 'Handles customer inquiries',
  status: 'active',
  // ...other fields
};

<AgentCard
  agent={agent}
  onEdit={() => handleEdit(agent.id)}
  onDelete={() => handleDelete(agent.id)}
/>
```

### AgentDialog

Modal dialog for creating and editing agents.

```tsx
import { AgentDialog } from '@/features/agents/components/AgentDialog';

<AgentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  agent={selectedAgent} // undefined for create mode
/>
```

### AgentForm

Form component with Zod validation for agent data.

```tsx
import { AgentForm } from '@/features/agents/components/AgentForm';

<AgentForm
  mode="create" // or "update"
  initialData={agent}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isSubmitting={isLoading}
/>
```

## Hooks

### useAgents

Fetches list of agents with optional filters.

```tsx
import { useAgents } from '@/features/agents/hooks';

const { data, isLoading, error } = useAgents({
  search: 'support',
  status: 'active',
  page: 1,
});
```

### useAgent

Fetches a single agent by ID.

```tsx
import { useAgent } from '@/features/agents/hooks';

const { data: agent, isLoading } = useAgent('agent-123');
```

### useCreateAgent / useUpdateAgent / useDeleteAgent

Mutation hooks for agent CRUD operations.

```tsx
import { useCreateAgent, useUpdateAgent, useDeleteAgent } from '@/features/agents/hooks';

const createAgent = useCreateAgent();
const updateAgent = useUpdateAgent();
const deleteAgent = useDeleteAgent();

// Create
await createAgent.mutateAsync({ name: 'New Agent', ... });

// Update
await updateAgent.mutateAsync({ id: 'agent-123', input: { name: 'Updated' } });

// Delete
await deleteAgent.mutateAsync('agent-123');
```

## Types

```typescript
interface Agent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  pipelineId?: string;
  pipelineName?: string;
  config: AgentConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type AgentStatus = 'active' | 'inactive' | 'draft';

interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

interface CreateAgentInput {
  name: string;
  description?: string;
  pipelineId?: string;
  config: AgentConfig;
}
```

## Query Keys

```typescript
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters?: AgentFilters) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};
```

## API Integration

All agent operations use the `agentsApi` service:

```typescript
import { agentsApi } from '@/features/agents/api';

// List agents
const response = await agentsApi.getAll({ status: 'active' });

// Get single agent
const agent = await agentsApi.getById('agent-123');

// Create agent
const newAgent = await agentsApi.create({ name: 'New Agent', ... });

// Update agent
const updated = await agentsApi.update('agent-123', { name: 'Updated' });

// Delete agent
await agentsApi.delete('agent-123');
```

## Testing

Tests are located in `src/features/agents/components/__tests__/` and `src/features/agents/hooks/__tests__/`.

```bash
# Run agent tests
npm run test -- --grep "Agent"
```

Test coverage includes:
- Component rendering
- Form validation
- User interactions
- Loading states
- Error handling
- API integration
