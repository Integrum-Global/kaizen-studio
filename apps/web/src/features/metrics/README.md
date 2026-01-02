# Metrics Dashboard Feature

A comprehensive metrics dashboard for monitoring agents, executions, and system performance in Kaizen Studio.

## Overview

The metrics feature provides real-time visualization of key performance indicators (KPIs) and system metrics through an interactive dashboard with charts, filters, and summary statistics.

## Features

- **KPI Cards**: Display key metrics with trend indicators and sparklines
- **Time Series Charts**: Interactive line charts for detailed metric analysis
- **Real-time Filtering**: Filter by time range and category
- **Summary Statistics**: Overview panel with 8 key metrics
- **Responsive Design**: Mobile-first layout with adaptive grid
- **Loading States**: Skeleton components for smooth UX
- **Error Handling**: Comprehensive error states and messages

## Directory Structure

```
metrics/
├── types/                     # TypeScript type definitions
│   ├── metric.ts             # Core metric types
│   └── index.ts              # Type exports
├── api/                       # API layer
│   ├── metrics.ts            # Mock API implementation
│   └── index.ts              # API exports
├── hooks/                     # React Query hooks
│   ├── useMetrics.ts         # Custom hooks and query keys
│   └── index.ts              # Hook exports
├── components/                # React components
│   ├── MetricsDashboard.tsx  # Main dashboard component
│   ├── MetricCard.tsx        # Individual metric card with sparkline
│   ├── MetricChart.tsx       # Time series chart component
│   ├── MetricsFilters.tsx    # Filter controls
│   ├── MetricsSummary.tsx    # Summary statistics panel
│   ├── __tests__/            # Component tests
│   │   ├── MetricCard.test.tsx
│   │   ├── MetricChart.test.tsx
│   │   ├── MetricsFilters.test.tsx
│   │   ├── MetricsSummary.test.tsx
│   │   └── MetricsDashboard.test.tsx
│   └── index.ts              # Component exports
├── index.ts                   # Feature barrel export
└── README.md                  # This file
```

## Types

### Core Types

```typescript
export type MetricTrend = "up" | "down" | "stable";
export type TimeGranularity = "1h" | "6h" | "24h" | "7d" | "30d";
export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "90d";

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  trend: MetricTrend;
  category: string;
  description?: string;
}

export interface MetricSeries {
  metricId: string;
  metricName: string;
  dataPoints: DataPoint[];
  unit: string;
}

export interface MetricFilter {
  timeRange: TimeRange;
  granularity?: TimeGranularity;
  resource?: string;
  metric?: string;
  category?: string;
}

export interface MetricsSummary {
  totalAgents: number;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  activeUsers: number;
  apiCalls: number;
  errorRate: number;
  p95ResponseTime: number;
}
```

## API Layer

The API layer uses mock data for frontend-only development. Replace with actual API calls when backend is ready.

```typescript
import { metricsApi } from "@/features/metrics";

// Get all metrics
const metrics = await metricsApi.getAll({ timeRange: "24h" });

// Get single metric
const metric = await metricsApi.getById("total-agents");

// Get time series
const series = await metricsApi.getSeries(["total-agents", "success-rate"]);

// Get summary
const summary = await metricsApi.getSummary({ timeRange: "7d" });
```

## Hooks

React Query hooks for data fetching with automatic caching and refetching.

```typescript
import {
  useMetrics,
  useMetricSeries,
  useMetricsSummary,
} from "@/features/metrics";

// Get metrics with filters
const { data, isPending, error } = useMetrics({
  timeRange: "24h",
  category: "agents",
});

// Get time series
const { data: series } = useMetricSeries(["total-agents", "success-rate"], {
  timeRange: "7d",
});

// Get summary
const { data: summary } = useMetricsSummary({ timeRange: "30d" });
```

## Components

### MetricsDashboard

Main dashboard component orchestrating all sub-components.

```typescript
import { MetricsDashboard } from '@/features/metrics';

function MetricsPage() {
  return <MetricsDashboard />;
}
```

### MetricCard

Individual metric card with optional sparkline.

```typescript
import { MetricCard } from '@/features/metrics';

<MetricCard
  metric={metric}
  showSparkline
  onClick={() => handleClick(metric.id)}
/>
```

### MetricChart

Time series line chart component.

```typescript
import { MetricChart } from '@/features/metrics';

<MetricChart series={seriesData} height={400} />
```

### MetricsFilters

Filter controls for time range and category.

```typescript
import { MetricsFilters } from '@/features/metrics';

<MetricsFilters
  filters={filters}
  onFiltersChange={setFilters}
  onRefresh={handleRefresh}
  isRefreshing={isPending}
/>
```

### MetricsSummary

Summary statistics panel.

```typescript
import { MetricsSummary } from '@/features/metrics';

<MetricsSummary summary={summaryData} isLoading={isPending} />
```

## Usage Example

```typescript
import { MetricsDashboard } from '@/features/metrics';
import { QueryClientProvider } from '@tanstack/react-query';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MetricsDashboard />
    </QueryClientProvider>
  );
}
```

## Testing

Comprehensive test suite using Vitest and React Testing Library.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test MetricCard.test.tsx
```

### Test Coverage

- ✅ MetricCard: Rendering, formatting, trends, sparklines, clicks
- ✅ MetricChart: SVG rendering, data points, formatting, empty states
- ✅ MetricsFilters: Time range, category, refresh button, responsive
- ✅ MetricsSummary: Statistics display, formatting, loading states, trends
- ✅ MetricsDashboard: Integration, data fetching, interactions, error handling

## Responsive Design

The dashboard is fully responsive with breakpoints:

- **Mobile** (< 768px): Single column layout
- **Tablet** (768px - 1024px): 2-column grid
- **Desktop** (> 1024px): 4-column grid

## Performance Considerations

- ✅ React Query caching (60s stale time for metrics)
- ✅ Optimistic updates for interactions
- ✅ Skeleton loading states
- ✅ Debounced filter changes
- ✅ Lazy chart rendering (only when clicked)
- ✅ SVG-based charts (lightweight, scalable)

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Custom metric builder
- [ ] Export to CSV/PDF
- [ ] Advanced chart types (bar, pie, area)
- [ ] Metric comparison tool
- [ ] Alert threshold configuration
- [ ] Historical data comparison
- [ ] Custom dashboard layouts

## Dependencies

- **React 19**: UI framework
- **@tanstack/react-query**: Server state management
- **lucide-react**: Icons
- **shadcn/ui**: UI components (Card, Button, Select, etc.)
- **date-fns**: Date formatting (if needed)

## Integration with Backend

When integrating with the actual backend API:

1. Replace mock API in `api/metrics.ts` with real API calls
2. Update API endpoints to match backend routes
3. Adjust type definitions if needed
4. Update error handling for specific API error codes
5. Add authentication headers via `apiClient`

```typescript
// Example backend integration
import apiClient from "@/api";

export const metricsApi = {
  getAll: async (filters?: MetricFilter): Promise<MetricsResponse> => {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append("time_range", filters.timeRange);
    if (filters?.category) params.append("category", filters.category);

    const response = await apiClient.get<MetricsResponse>(
      `/api/metrics?${params.toString()}`
    );
    return response.data;
  },
  // ... other methods
};
```

## License

Internal use only - Kaizen Studio Frontend
