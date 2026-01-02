# Pipeline Trust Integration Components

This directory contains components and hooks for integrating EATP (Enterprise Agent Trust Protocol) trust validation into the pipeline canvas.

## Components

### 1. TrustOverlay

Toggleable side panel overlay for pipeline canvas showing trust status.

**Features:**
- List of all agents in pipeline
- Trust status for each agent
- Real-time verification indicators
- Warnings for untrusted agents
- "Validate All" button
- Summary stats (trusted/untrusted count)
- Collapsible/expandable UI

**Props:**
```typescript
interface TrustOverlayProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  defaultExpanded?: boolean;
  onClose?: () => void;
  onViewAgent?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
<TrustOverlay
  pipelineId="pipeline-123"
  agentIds={["agent-1", "agent-2"]}
  requiredCapabilities={{
    "agent-1": ["data_processing", "api_access"],
  }}
  onViewAgent={(id) => navigate(`/agents/${id}`)}
  onEstablishTrust={(id) => openTrustDialog(id)}
/>
```

---

### 2. PipelineTrustValidator

Trust validation before execution with progress tracking.

**Features:**
- Validates all agent trust chains
- Shows validation progress
- Displays validation errors/warnings
- Blocks execution if trust invalid (configurable)
- "Establish Trust" suggestions for untrusted agents
- Re-validation capability

**Props:**
```typescript
interface PipelineTrustValidatorProps {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities?: Record<string, string[]>;
  blockExecutionOnFailure?: boolean;
  onExecute?: () => void;
  onEstablishTrust?: (agentId: string) => void;
  className?: string;
}
```

**Usage:**
```tsx
<PipelineTrustValidator
  pipelineId="pipeline-123"
  agentIds={["agent-1", "agent-2"]}
  blockExecutionOnFailure={true}
  onExecute={() => runPipeline()}
  onEstablishTrust={(id) => openTrustDialog(id)}
/>
```

---

### 3. AgentTrustStatus

Mini widget/badge for pipeline nodes showing trust status.

**Features:**
- Small badge showing trust status
- Click to open trust detail popup
- Capability match indicator
- Visual indicator (green check, yellow warning, red X)
- Constraint violation warnings

**Props:**
```typescript
interface AgentTrustStatusProps {
  agentId: string;
  agentName: string;
  trustStatus: TrustStatus;
  requiredCapabilities?: string[];
  availableCapabilities?: string[];
  constraintViolations?: string[];
  onClick?: () => void;
  onEstablishTrust?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
<AgentTrustStatus
  agentId="agent-123"
  agentName="Data Processor"
  trustStatus={TrustStatus.VALID}
  requiredCapabilities={["data_processing"]}
  availableCapabilities={["data_processing", "api_access"]}
  onClick={() => viewDetails("agent-123")}
/>
```

---

### 4. TrustValidationResult

Displays validation result for a single agent.

**Features:**
- List of validated agents
- Pass/fail status for each
- Detailed error messages
- Suggestions for fixing issues
- Export validation report

**Props:**
```typescript
interface TrustValidationResultProps {
  status: AgentPipelineStatus;
  onViewTrustChain?: (agentId: string) => void;
  onEstablishTrust?: (agentId: string) => void;
  onExportReport?: (agentId: string) => void;
  showDetails?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<TrustValidationResult
  status={agentStatus}
  onViewTrustChain={(id) => navigate(`/trust/${id}`)}
  onEstablishTrust={(id) => openDialog(id)}
  onExportReport={(id) => exportReport(id)}
/>
```

---

## Hooks

### usePipelineTrustValidation

Validate trust for all agents in a pipeline.

**Features:**
- Validate all agents in pipeline
- Track validation state
- Handle batch validation
- Cache validation results

**Usage:**
```tsx
const { data, isPending, error, refetch } = usePipelineTrustValidation(
  pipelineId,
  agentIds,
  requiredCapabilities
);
```

### useAgentPipelineStatus

Get agent trust status for a specific pipeline.

**Usage:**
```tsx
const { data: status } = useAgentPipelineStatus(agentId, pipelineId);
```

### useBatchValidatePipelineAgents

Batch validate multiple agents.

**Usage:**
```tsx
const { mutate: validate } = useBatchValidatePipelineAgents();
validate({
  pipelineId,
  agentIds,
  requiredCapabilities,
});
```

### useValidationCache

Get cached validation results.

**Usage:**
```tsx
const { getCachedValidation, invalidateCache } = useValidationCache(
  pipelineId,
  agentIds
);
```

---

## Types

### PipelineAgent
```typescript
interface PipelineAgent {
  node_id: string;
  agent_id: string;
  agent_name: string;
  required_capabilities: string[];
}
```

### TrustValidationResult
```typescript
interface TrustValidationResult {
  agent_id: string;
  agent_name: string;
  is_valid: boolean;
  trust_status: TrustStatus;
  missing_capabilities: string[];
  constraint_violations: string[];
  suggestions: string[];
}
```

### PipelineTrustValidation
```typescript
interface PipelineTrustValidation {
  pipeline_id: string;
  is_valid: boolean;
  validated_at: string;
  results: TrustValidationResult[];
  summary: {
    total_agents: number;
    valid_count: number;
    invalid_count: number;
    warning_count: number;
  };
}
```

---

## Integration Patterns

### Pattern 1: Pipeline Canvas with Side Panel

```tsx
function PipelineCanvas() {
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        {/* Canvas content */}
      </div>
      <TrustOverlay
        pipelineId={pipelineId}
        agentIds={agentIds}
        requiredCapabilities={capabilities}
      />
    </div>
  );
}
```

### Pattern 2: Node-Level Trust Indicator

```tsx
function PipelineNode({ agent }) {
  return (
    <div className="relative">
      <NodeComponent agent={agent} />
      <div className="absolute -right-2 -top-2">
        <AgentTrustStatus
          agentId={agent.id}
          agentName={agent.name}
          trustStatus={agent.trustStatus}
        />
      </div>
    </div>
  );
}
```

### Pattern 3: Pre-Execution Validation

```tsx
function ExecutePipelineDialog() {
  return (
    <Dialog>
      <DialogContent>
        <PipelineTrustValidator
          pipelineId={pipelineId}
          agentIds={agentIds}
          blockExecutionOnFailure={true}
          onExecute={handleExecute}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Best Practices

1. **Always validate before execution**: Use `PipelineTrustValidator` before executing pipelines
2. **Show trust status on nodes**: Use `AgentTrustStatus` for immediate visual feedback
3. **Enable validation caching**: Use default staleTime (30s) to avoid excessive API calls
4. **Provide user actions**: Always provide `onEstablishTrust` callback for failed validations
5. **Handle loading states**: Components have built-in loading states, but handle errors appropriately
6. **Export reports**: Use `onExportReport` for audit and debugging purposes

---

## Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `@/components/ui/*` - Shadcn/ui components
- `lucide-react` - Icons
- `@/lib/utils` - Utility functions (cn)

---

## See Also

- `USAGE_EXAMPLE.tsx` - Complete usage examples
- `../../types/index.ts` - Type definitions
- `../../api/index.ts` - API client functions
- `../../hooks/index.ts` - Additional hooks
