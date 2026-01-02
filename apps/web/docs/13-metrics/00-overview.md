# Metrics Dashboard

The Metrics Dashboard feature provides comprehensive monitoring and visualization of system metrics including agent performance, API usage, and resource utilization.

## Feature Location

```
src/features/metrics/
├── api/
│   └── metrics.ts          # Metrics API client
├── components/
│   ├── MetricCard.tsx      # Individual metric display card
│   ├── MetricChart.tsx     # Time-series chart visualization
│   ├── MetricsDashboard.tsx # Main dashboard container
│   ├── MetricsFilters.tsx  # Filter controls
│   ├── MetricsSummary.tsx  # Summary statistics grid
│   └── __tests__/          # Component tests
├── hooks/
│   └── useMetrics.ts       # React Query hooks
├── types/
│   └── index.ts            # TypeScript definitions
└── index.ts                # Barrel exports
```

## Components

### MetricsDashboard

Main container component that orchestrates the metrics display.

```tsx
import { MetricsDashboard } from '@/features/metrics';

function MonitoringPage() {
  return <MetricsDashboard />;
}
```

### MetricCard

Displays a single metric with trend indicator and optional sparkline.

```tsx
import { MetricCard } from '@/features/metrics';

<MetricCard
  metric={{
    id: 'cpu-usage',
    name: 'CPU Usage',
    value: 65.5,
    unit: '%',
    trend: 'up',
    change: 5.2,
    changePercent: 8.6,
  }}
  showSparkline
  onClick={() => handleMetricClick('cpu-usage')}
/>
```

### MetricChart

Time-series visualization using SVG.

```tsx
import { MetricChart } from '@/features/metrics';

<MetricChart
  series={{
    id: 'response-time',
    name: 'Response Time',
    dataPoints: [
      { timestamp: '2024-01-01T00:00:00Z', value: 120 },
      { timestamp: '2024-01-01T01:00:00Z', value: 135 },
      // ...
    ],
  }}
  height={200}
  color="#3b82f6"
/>
```

### MetricsSummary

Grid display of key performance indicators.

```tsx
import { MetricsSummary } from '@/features/metrics';

<MetricsSummary
  summary={{
    totalAgents: 42,
    totalExecutions: 1247,
    successRate: 98.5,
    avgResponseTime: 245,
    activeUsers: 127,
    apiCalls: 45632,
    errorRate: 1.5,
    p95ResponseTime: 850,
  }}
  isLoading={false}
/>
```

### MetricsFilters

Filter controls for time range and category selection.

```tsx
import { MetricsFilters } from '@/features/metrics';

<MetricsFilters
  filters={{ timeRange: '24h', category: 'agents' }}
  onFiltersChange={(filters) => setFilters(filters)}
  onRefresh={() => refetch()}
  isRefreshing={isRefetching}
/>
```

## Hooks

### useMetrics

Fetches metrics list with filtering.

```tsx
import { useMetrics } from '@/features/metrics';

const { data, isLoading, error, refetch } = useMetrics({
  timeRange: '24h',
  category: 'agents',
});
```

### useMetricSeries

Fetches time-series data for multiple metrics.

```tsx
import { useMetricSeries } from '@/features/metrics';

const { data, isLoading } = useMetricSeries(
  ['cpu-usage', 'memory-usage'],
  { timeRange: '7d' }
);
```

### useMetricsSummary

Fetches aggregated summary statistics.

```tsx
import { useMetricsSummary } from '@/features/metrics';

const { data, isLoading } = useMetricsSummary({ timeRange: '24h' });
```

## Types

```typescript
interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  description?: string;
  category?: MetricCategory;
}

interface MetricSeries {
  id: string;
  name: string;
  dataPoints: MetricDataPoint[];
  color?: string;
}

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface MetricsSummary {
  totalAgents: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
  p95ResponseTime: number;
}

type MetricCategory = 'agents' | 'pipelines' | 'api' | 'resources';

interface MetricFilter {
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d';
  category?: MetricCategory;
}
```

## Testing

Run metrics tests:

```bash
npm run test -- src/features/metrics
```

Test coverage includes:
- MetricCard rendering and interactions
- MetricChart SVG generation
- MetricsDashboard integration
- MetricsFilters state management
- MetricsSummary formatting
