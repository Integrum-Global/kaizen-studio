# Metrics Feature

The Metrics feature provides real-time monitoring and analytics for agent performance, pipeline executions, and system health.

## Overview

The metrics dashboard displays:
- **Summary Statistics**: Key metrics at a glance (total agents, executions, success rate)
- **Key Metrics Grid**: Individual metric cards with sparklines
- **Time Series Charts**: Detailed visualizations when metrics are selected
- **Filters**: Time range and agent type filtering

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/metrics` | MetricsPage | Main metrics dashboard |

## Components

### MetricsDashboard
The main dashboard orchestrating all metrics components.

Features:
- Time range filtering (24h, 7d, 30d)
- Agent type filtering
- Refresh button with loading state
- Click-to-chart interaction

### MetricsSummary
High-level statistics display.

Features:
- Total agents count
- Total executions count
- Success rate percentage
- Average response time
- Active users count
- API calls count
- Error rate percentage
- P95 response time

### MetricCard
Individual metric display with optional sparkline.

Features:
- Metric name and unit
- Current value with formatting
- Trend indicator (up/down/stable)
- Sparkline visualization
- Click handler for chart selection

### MetricChart
Time series chart for selected metrics.

Features:
- Line chart visualization
- Data point tooltips
- Responsive sizing
- Multiple series support

### MetricsFilters
Filter controls for metrics data.

Features:
- Time range buttons (24h, 7d, 30d)
- Agent type dropdown
- Refresh button
- Loading indicator

## Data Flow

The metrics feature uses React Query for data fetching:

```typescript
// src/features/metrics/api/metrics.ts
export const metricsApi = {
  getMetrics: async (filters: MetricFilter): Promise<MetricsResponse> => { ... },
  getSummary: async (filters: MetricFilter): Promise<MetricsSummary> => { ... },
  getMetricSeries: async (metricIds: string[], filters: MetricFilter): Promise<SeriesResponse> => { ... },
};
```

## React Query Hooks

```typescript
// Available hooks from src/features/metrics/hooks
useMetrics(filters)              // Get metrics list with filtering
useMetricsSummary(filters)       // Get summary statistics
useMetricSeries(ids, filters)    // Get time series data for selected metrics
```

## Types

Key TypeScript interfaces:

```typescript
type TimeRange = "1h" | "24h" | "7d" | "30d" | "custom";

interface MetricFilter {
  timeRange: TimeRange;
  agentType?: string;
  startDate?: string;
  endDate?: string;
}

interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  type: MetricType;
  trend: TrendDirection;
  changePercent: number;
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

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface MetricSeries {
  metricId: string;
  name: string;
  dataPoints: MetricDataPoint[];
}
```

## Interaction Pattern

1. **View Summary**: Summary statistics show at the top
2. **Browse Metrics**: Key metrics displayed in a grid
3. **Select Metrics**: Click metric cards to add them to charts
4. **View Charts**: Selected metrics show as time series charts
5. **Filter Data**: Use time range and agent type filters
6. **Refresh**: Click refresh to update data

## Chart Selection

When a user clicks on a metric card:
1. The metric ID is added to `selectedMetricIds` state
2. `useMetricSeries` hook fetches time series data
3. Charts appear in the "Time Series Charts" section
4. Clicking again removes the metric from selection

## Accessibility

The metrics feature implements accessibility requirements:
- Proper heading hierarchy (h1 for page, h2 for sections)
- ARIA labels on interactive elements
- Keyboard navigation for cards
- Focus management
- Screen reader announcements for data updates

## Testing

Run metrics tests:
```bash
npx playwright test e2e/metrics.spec.ts --project=chromium
```

Tests cover:
- Dashboard header and content
- Summary statistics display
- Key metrics grid
- Time series charts section
- Time range selection
- Responsive design (mobile/desktop)
- Accessibility requirements
