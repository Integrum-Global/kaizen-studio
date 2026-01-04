# Value Chains Feature

The Value Chains feature provides enterprise-wide visibility into business processes that span multiple departments. It helps Level 3 users (Value Chain Owners) manage and monitor trust relationships across the organization.

## What It Is

A **value chain** represents an end-to-end business process that involves multiple departments working together. Each value chain:

- Has a defined status (active, paused, archived)
- Contains multiple departments with specific roles
- Tracks trust health across all participants
- Monitors performance metrics and costs

## Core Types

```typescript
// Trust status for relationships
type TrustStatus = 'valid' | 'expiring' | 'expired' | 'revoked';

// Trust health metrics
interface TrustHealth {
  valid: number;
  expiring: number;
  expired: number;
  revoked: number;
  percentage: number;
  status: TrustStatus;
}

// Department in a value chain
interface Department {
  id: string;
  name: string;
  description?: string;
  workUnitCount: number;
  userCount: number;
  trustStatus: TrustStatus;
  roleLabel?: string;
}

// Value chain entity
interface ValueChain {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  departments: Department[];
  trustHealth: TrustHealth;
  metrics: ValueChainMetrics;
  lastAuditAt: string;
}
```

## Components

### ValueChainCard
Displays a summary card for a value chain with department flow and metrics.

```tsx
import { ValueChainCard } from '@/features/value-chains/components';

<ValueChainCard
  valueChain={valueChain}
  onViewDetails={() => navigate(`/work/value-chains/${id}`)}
  onViewTrustMap={() => openTrustMap(id)}
  onViewCompliance={() => openCompliance(id)}
  onViewAudit={() => openAudit(id)}
/>
```

### DepartmentFlowVisualization
Shows the flow of departments in a value chain with trust status indicators.

```tsx
import { DepartmentFlowVisualization } from '@/features/value-chains/components';

<DepartmentFlowVisualization
  departments={valueChain.departments}
  compact={false}
  trustStatusOverride="valid"
/>
```

### EnterpriseOverview
Dashboard cards showing enterprise-wide trust health summary.

```tsx
import { EnterpriseOverview } from '@/features/value-chains/components';

<EnterpriseOverview
  trustHealth={metrics.trustHealth}
  expiringCount={metrics.expiringCount}
  issuesCount={metrics.issuesCount}
  onViewTrustDetails={() => navigate('/govern/compliance')}
  onViewExpiring={() => handleExpiringClick()}
  onViewIssues={() => handleIssuesClick()}
/>
```

### ValueChainMetrics
Performance metrics dashboard with execution stats, cost consumption, and error trends.

```tsx
import { ValueChainMetrics } from '@/features/value-chains/components';

<ValueChainMetrics
  data={{
    execution: executionStats,
    cost: costMetrics,
    errorTrend: errorTrendData,
  }}
  dateRange={{
    start: new Date('2025-01-01'),
    end: new Date('2025-01-07'),
  }}
/>
```

## API Functions

```typescript
import {
  fetchValueChains,
  fetchValueChain,
  fetchEnterpriseMetrics,
  createValueChain,
  updateValueChain,
  deleteValueChain,
} from '@/features/value-chains/api';

// Fetch all value chains with filters
const chains = await fetchValueChains({
  status: 'active',
  departmentId: 'dept-1',
  trustStatus: 'valid',
  searchQuery: 'CI/CD',
});

// Fetch single value chain
const chain = await fetchValueChain('chain-1');

// Fetch enterprise metrics
const metrics = await fetchEnterpriseMetrics();
```

## Hooks

```typescript
import {
  useValueChains,
  useValueChain,
  useEnterpriseMetrics,
  useCreateValueChain,
  useUpdateValueChain,
  useDeleteValueChain,
} from '@/features/value-chains/hooks';

// Fetch value chains with filters
const { data, isLoading } = useValueChains({
  status: 'active',
});

// Fetch single value chain
const { data: chain } = useValueChain('chain-1');

// Fetch enterprise metrics
const { data: metrics } = useEnterpriseMetrics();

// Mutations
const createMutation = useCreateValueChain();
const updateMutation = useUpdateValueChain();
const deleteMutation = useDeleteValueChain();
```

## Usage Example

```tsx
import { useValueChains, useEnterpriseMetrics } from '@/features/value-chains';
import { ValueChainCard, EnterpriseOverview } from '@/features/value-chains/components';

function ValueChainsPage() {
  const { data: chainsData, isLoading } = useValueChains({ status: 'active' });
  const { data: metrics } = useEnterpriseMetrics();

  if (isLoading) return <LoadingScreen />;

  return (
    <div>
      <EnterpriseOverview
        trustHealth={metrics?.trustHealth}
        expiringCount={metrics?.expiringCount}
        issuesCount={metrics?.issuesCount}
      />

      <div className="grid gap-4">
        {chainsData?.valueChains.map((chain) => (
          <ValueChainCard
            key={chain.id}
            valueChain={chain}
          />
        ))}
      </div>
    </div>
  );
}
```
