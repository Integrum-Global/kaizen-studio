# Execution & Deployment

This section covers the Test Panel for pipeline execution and the Deployment management UI.

## Test Panel

The Test Panel allows users to test pipelines with custom inputs and view execution results in real-time.

### Components

#### TestPanel

Main component for pipeline testing.

```tsx
import { TestPanel } from '@/features/execution/components/TestPanel';

<TestPanel pipelineId="pipeline-123" />
```

Features:
- Input form for test data
- Execute button with loading state
- Real-time execution logs
- Node status visualization
- Output display with JSON formatting
- Execution history

#### ExecutionLogs

Displays streaming logs from pipeline execution.

```tsx
import { ExecutionLogs } from '@/features/execution/components/ExecutionLogs';

<ExecutionLogs
  logs={executionStore.logs}
  nodeExecutions={executionStore.nodeExecutions}
/>
```

Log levels:
- `info` - General execution information
- `warn` - Warnings during execution
- `error` - Errors and failures
- `debug` - Detailed debugging info

#### NodeStatusIndicator

Shows execution status for individual nodes.

```tsx
import { NodeStatusIndicator } from '@/features/execution/components/NodeStatusIndicator';

<NodeStatusIndicator
  status={nodeExecution.status}
  startTime={nodeExecution.startTime}
  endTime={nodeExecution.endTime}
/>
```

Status states:
- `pending` - Not yet executed
- `running` - Currently executing
- `completed` - Successfully finished
- `failed` - Execution failed
- `skipped` - Skipped due to conditions

### Execution Store

Zustand store for managing execution state.

```tsx
import { useExecutionStore } from '@/store/execution';

const {
  executionId,
  status,
  logs,
  nodeExecutions,
  inputs,
  outputs,
  startTime,
  endTime,
  startExecution,
  addLog,
  updateNodeStatus,
  setOutputs,
  setStatus,
  completeExecution,
  reset,
} = useExecutionStore();
```

#### Store Actions

```typescript
// Start a new execution
startExecution('exec-123', { query: 'test input' });

// Add execution log
addLog({
  timestamp: new Date(),
  level: 'info',
  message: 'Processing node...',
  nodeId: 'node-1',
});

// Update node status
updateNodeStatus('node-1', {
  nodeId: 'node-1',
  status: 'completed',
  endTime: new Date(),
  output: { result: 'success' },
});

// Complete execution
completeExecution({ result: 'final output' });

// Or complete with error
completeExecution(undefined, 'Execution failed: timeout');
```

### Types

```typescript
type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';
type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  data?: unknown;
}

interface NodeExecution {
  nodeId: string;
  status: NodeStatus;
  startTime?: Date;
  endTime?: Date;
  input?: unknown;
  output?: unknown;
  error?: string;
}

interface ExecutionState {
  executionId: string | null;
  status: ExecutionStatus;
  logs: ExecutionLog[];
  nodeExecutions: Map<string, NodeExecution>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  startTime: Date | null;
  endTime: Date | null;
}
```

## Deployment Management

UI for deploying pipelines to production environments.

### Components

#### DeploymentList

Displays all deployments in a searchable list.

```tsx
import { DeploymentList } from '@/features/deployments/components/DeploymentList';

<DeploymentList />
```

Features:
- Search by deployment/pipeline name
- Filter by environment (dev, staging, production)
- Filter by status (active, inactive, pending)
- Grid view with deployment cards
- Pagination
- Start/Stop controls

#### DeploymentCard

Individual deployment card component.

```tsx
import { DeploymentCard } from '@/features/deployments/components/DeploymentCard';

<DeploymentCard
  deployment={deployment}
  onEdit={() => handleEdit(deployment.id)}
  onDelete={() => handleDelete(deployment.id)}
  onStart={() => handleStart(deployment.id)}
  onStop={() => handleStop(deployment.id)}
/>
```

#### DeploymentDialog

Modal for creating and editing deployments.

```tsx
import { DeploymentDialog } from '@/features/deployments/components/DeploymentDialog';

<DeploymentDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  deployment={selectedDeployment} // undefined for create
/>
```

#### DeploymentForm

Form with validation for deployment configuration.

```tsx
import { DeploymentForm } from '@/features/deployments/components/DeploymentForm';

<DeploymentForm
  mode="create"
  initialData={deployment}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isSubmitting={isLoading}
/>
```

### Hooks

#### useDeployments

Fetches list of deployments.

```tsx
import { useDeployments } from '@/features/deployments/hooks';

const { data, isLoading, error } = useDeployments({
  environment: 'production',
  status: 'active',
  page: 1,
});
```

#### useDeployment

Fetches a single deployment.

```tsx
import { useDeployment } from '@/features/deployments/hooks';

const { data: deployment, isLoading } = useDeployment('deploy-123');
```

#### Mutation Hooks

```tsx
import {
  useCreateDeployment,
  useUpdateDeployment,
  useDeleteDeployment,
  useStartDeployment,
  useStopDeployment,
} from '@/features/deployments/hooks';

const create = useCreateDeployment();
const update = useUpdateDeployment();
const del = useDeleteDeployment();
const start = useStartDeployment();
const stop = useStopDeployment();

// Create deployment
await create.mutateAsync({
  pipelineId: 'pipeline-123',
  environment: 'production',
  config: { replicas: 3 },
});

// Start/Stop
await start.mutateAsync('deploy-123');
await stop.mutateAsync('deploy-123');
```

### Types

```typescript
type Environment = 'development' | 'staging' | 'production';
type DeploymentStatus = 'active' | 'inactive' | 'pending' | 'failed';

interface Deployment {
  id: string;
  pipelineId: string;
  pipelineName: string;
  version: string;
  environment: Environment;
  status: DeploymentStatus;
  endpoint: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  config: DeploymentConfig;
}

interface DeploymentConfig {
  replicas: number;
  maxConcurrency: number;
  timeout: number;
  retries: number;
  environment: Record<string, string>;
}

interface CreateDeploymentInput {
  pipelineId: string;
  environment: Environment;
  config?: Partial<DeploymentConfig>;
}

interface UpdateDeploymentInput {
  config?: Partial<DeploymentConfig>;
}
```

### Query Keys

```typescript
export const deploymentKeys = {
  all: ['deployments'] as const,
  lists: () => [...deploymentKeys.all, 'list'] as const,
  list: (filters?: DeploymentFilters) => [...deploymentKeys.lists(), filters] as const,
  details: () => [...deploymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...deploymentKeys.details(), id] as const,
};
```

## Testing

Tests are located in:
- `src/store/__tests__/execution.test.ts`
- `src/features/execution/components/__tests__/`
- `src/features/deployments/components/__tests__/`
- `src/features/deployments/hooks/__tests__/`

```bash
# Run execution tests
npm run test -- --grep "Execution"

# Run deployment tests
npm run test -- --grep "Deployment"

# Run all Phase 2 tests
npm run test
```

Test coverage includes:
- Execution store state management
- Log handling
- Node status updates
- Deployment CRUD operations
- Form validation
- Loading states
- Error handling
