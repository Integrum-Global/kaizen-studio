# Analytics Feature

Comprehensive analytics dashboard with reusable chart components for Kaizen Studio.

## Overview

This feature provides a complete analytics solution with:

- **Interactive Charts**: Line, Bar, and Pie charts using Recharts
- **Real-time Metrics**: Track executions, API usage, success rates, and more
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript support
- **Testing**: Complete vitest test coverage

## Structure

```
analytics/
├── types/              # TypeScript type definitions
│   └── analytics.ts    # Chart data, metrics, filters
├── api/                # API layer with mock data
│   └── analytics.ts    # Mock API functions
├── hooks/              # React Query hooks
│   └── useAnalytics.ts # Data fetching hooks
├── components/         # React components
│   ├── AnalyticsDashboard.tsx   # Main dashboard view
│   ├── LineChart.tsx            # Time series chart
│   ├── BarChart.tsx             # Comparison chart
│   ├── PieChart.tsx             # Distribution chart
│   ├── AnalyticsCard.tsx        # Card wrapper
│   ├── TrendIndicator.tsx       # Trend arrow with %
│   └── __tests__/               # Component tests
└── index.ts            # Barrel export
```

## Usage

### Analytics Dashboard

```tsx
import { AnalyticsDashboard } from "@/features/analytics";

function App() {
  return <AnalyticsDashboard />;
}
```

### Individual Components

#### Line Chart (Time Series)

```tsx
import { LineChart } from "@/features/analytics";

const data = [
  { timestamp: "2024-01-01T00:00:00Z", value: 100 },
  { timestamp: "2024-01-02T00:00:00Z", value: 150 },
];

<LineChart
  data={data}
  color="hsl(var(--chart-1))"
  height={300}
  showGrid={true}
  label="Executions"
/>;
```

#### Bar Chart (Comparisons)

```tsx
import { BarChart } from "@/features/analytics";

const data = {
  labels: ["Agent A", "Agent B", "Agent C"],
  datasets: [
    {
      label: "Executions",
      data: [100, 150, 120],
      color: "hsl(var(--chart-1))",
    },
    { label: "Success Rate", data: [95, 92, 98], color: "hsl(var(--chart-2))" },
  ],
};

<BarChart data={data} layout="vertical" />;
```

#### Pie Chart (Distributions)

```tsx
import { PieChart } from "@/features/analytics";

const data = [
  { name: "Production", value: 45, percentage: 45 },
  { name: "Staging", value: 30, percentage: 30 },
  { name: "Development", value: 25, percentage: 25 },
];

<PieChart data={data} innerRadius={60} showLegend={true} />;
```

#### Trend Indicator

```tsx
import { TrendIndicator } from '@/features/analytics';

<TrendIndicator value={12.5} trend="up" />
// Shows: ↑ +12.5%

<TrendIndicator value={-8.3} trend="down" />
// Shows: ↓ -8.3%
```

#### Analytics Card

```tsx
import { AnalyticsCard } from "@/features/analytics";

<AnalyticsCard
  title="Total Executions"
  description="Last 30 days"
  action={<Button>Export</Button>}
>
  <div className="text-3xl font-bold">45,678</div>
  <TrendIndicator value={12.5} />
</AnalyticsCard>;
```

### React Query Hooks

```tsx
import {
  useExecutionMetrics,
  useApiUsageMetrics,
  useMetricsSummary,
} from "@/features/analytics";

function MyComponent() {
  const { data, isPending, error } = useExecutionMetrics();

  if (isPending) return <AnalyticsCardSkeleton />;
  if (error) return <div>Error loading metrics</div>;

  return <LineChart data={data} />;
}
```

## API Reference

### Types

#### `TimeSeriesData`

```typescript
interface TimeSeriesData {
  timestamp: string; // ISO 8601 format
  value: number;
}
```

#### `ChartData`

```typescript
interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

interface Dataset {
  label: string;
  data: number[];
  color: string;
}
```

#### `CategoryData`

```typescript
interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}
```

#### `MetricData`

```typescript
interface MetricData {
  name: string;
  value: number;
  change: number; // Percentage
  trend: "up" | "down" | "neutral";
}
```

### Hooks

#### `useExecutionMetrics(filters?)`

Fetches agent execution metrics over time.

#### `useApiUsageMetrics(filters?)`

Fetches API usage metrics over time.

#### `useSuccessRateMetrics(filters?)`

Fetches success rate metrics over time.

#### `useAgentPerformance(filters?)`

Fetches agent performance comparison data.

#### `useDeploymentDistribution(filters?)`

Fetches deployment distribution by environment.

#### `useMetricsSummary(filters?)`

Fetches key metrics summary (Total, Success Rate, etc.).

#### `useErrorDistribution(filters?)`

Fetches error distribution by type.

## Component Props

### LineChart

| Prop         | Type               | Default                 | Description        |
| ------------ | ------------------ | ----------------------- | ------------------ |
| `data`       | `TimeSeriesData[]` | Required                | Time series data   |
| `dataKey`    | `string`           | `'value'`               | Data key to plot   |
| `xAxisKey`   | `string`           | `'timestamp'`           | X-axis data key    |
| `color`      | `string`           | `'hsl(var(--primary))'` | Line color         |
| `height`     | `number`           | `300`                   | Chart height in px |
| `showGrid`   | `boolean`          | `true`                  | Show grid lines    |
| `showLegend` | `boolean`          | `false`                 | Show legend        |
| `label`      | `string`           | `'Value'`               | Series label       |

### BarChart

| Prop         | Type                          | Default      | Description        |
| ------------ | ----------------------------- | ------------ | ------------------ |
| `data`       | `ChartData \| CategoryData[]` | Required     | Chart data         |
| `height`     | `number`                      | `300`        | Chart height in px |
| `showGrid`   | `boolean`                     | `true`       | Show grid lines    |
| `showLegend` | `boolean`                     | `true`       | Show legend        |
| `layout`     | `'horizontal' \| 'vertical'`  | `'vertical'` | Bar orientation    |

### PieChart

| Prop          | Type             | Default        | Description                        |
| ------------- | ---------------- | -------------- | ---------------------------------- |
| `data`        | `CategoryData[]` | Required       | Category data                      |
| `height`      | `number`         | `300`          | Chart height in px                 |
| `innerRadius` | `number`         | `0`            | Inner radius (0 = pie, >0 = donut) |
| `showLegend`  | `boolean`        | `true`         | Show legend                        |
| `showLabels`  | `boolean`        | `true`         | Show percentage labels             |
| `colors`      | `string[]`       | Default colors | Custom color array                 |

### TrendIndicator

| Prop       | Type                          | Default     | Description      |
| ---------- | ----------------------------- | ----------- | ---------------- |
| `value`    | `number`                      | Required    | Percentage value |
| `trend`    | `'up' \| 'down' \| 'neutral'` | Auto-detect | Trend direction  |
| `showIcon` | `boolean`                     | `true`      | Show arrow icon  |
| `showSign` | `boolean`                     | `true`      | Show +/- sign    |
| `suffix`   | `string`                      | `'%'`       | Value suffix     |

## Styling

All components use Tailwind CSS and respect the application's design system. Chart colors are defined in `src/index.css`:

```css
--chart-1: 238.7 83.5% 66.7%; /* Primary blue */
--chart-2: 160 84.1% 39.4%; /* Green */
--chart-3: 43.3 96.4% 56.3%; /* Yellow */
--chart-4: 280.4 89.1% 65.5%; /* Purple */
--chart-5: 346.8 77.2% 49.8%; /* Red */
```

Use them in components via `hsl(var(--chart-1))`, etc.

## Testing

Run tests:

```bash
npm run test
```

All components have comprehensive vitest tests in `components/__tests__/`.

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Export to CSV/PDF
- [ ] Custom date range picker
- [ ] Drill-down interactivity
- [ ] Compare time periods
- [ ] Custom metric builder
- [ ] Dashboard layout customization

## Dependencies

- **recharts**: Chart rendering
- **date-fns**: Date formatting
- **@tanstack/react-query**: Data fetching
- **lucide-react**: Icons
- **shadcn/ui**: UI components
