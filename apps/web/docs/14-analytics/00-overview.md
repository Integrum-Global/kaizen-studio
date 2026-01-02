# Analytics Charts

The Analytics feature provides data visualization components using recharts for displaying trends, distributions, and comparisons.

## Feature Location

```
src/features/analytics/
├── components/
│   ├── AnalyticsCard.tsx       # Container card for charts
│   ├── AnalyticsDashboard.tsx  # Main analytics view
│   ├── BarChart.tsx            # Bar chart component
│   ├── LineChart.tsx           # Line chart component
│   ├── PieChart.tsx            # Pie/donut chart component
│   ├── TrendIndicator.tsx      # Trend arrow with percentage
│   └── __tests__/              # Component tests
├── types/
│   └── index.ts                # TypeScript definitions
└── index.ts                    # Barrel exports
```

## Components

### AnalyticsDashboard

Main container displaying multiple analytics charts.

```tsx
import { AnalyticsDashboard } from '@/features/analytics';

function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
```

### LineChart

Time-series visualization with area fill option.

```tsx
import { LineChart } from '@/features/analytics';

<LineChart
  data={[
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 },
  ]}
  height={300}
  color="#3b82f6"
  dataLabel="Revenue"
  showGrid
  showLegend
/>
```

### BarChart

Vertical or horizontal bar chart.

```tsx
import { BarChart } from '@/features/analytics';

<BarChart
  data={[
    { label: 'Product A', value: 450 },
    { label: 'Product B', value: 320 },
    { label: 'Product C', value: 280 },
  ]}
  height={300}
  layout="vertical"
  showGrid
  showLegend
/>
```

### PieChart

Pie or donut chart for distributions.

```tsx
import { PieChart } from '@/features/analytics';

<PieChart
  data={[
    { label: 'Desktop', value: 55, color: '#3b82f6' },
    { label: 'Mobile', value: 35, color: '#10b981' },
    { label: 'Tablet', value: 10, color: '#f59e0b' },
  ]}
  height={300}
  innerRadius={60}  // For donut chart
  showLegend
/>
```

### TrendIndicator

Compact trend display with arrow and percentage.

```tsx
import { TrendIndicator } from '@/features/analytics';

<TrendIndicator
  value={12.5}
  trend="up"
  label="vs last month"
/>
```

### AnalyticsCard

Container card with header and content area.

```tsx
import { AnalyticsCard } from '@/features/analytics';

<AnalyticsCard
  title="Sales Overview"
  description="Monthly revenue trends"
  value="$125,000"
  trend={{ value: 8.3, direction: 'up' }}
>
  <LineChart data={salesData} />
</AnalyticsCard>
```

## Types

```typescript
interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface CategoryData {
  category: string;
  [key: string]: string | number;
}

interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'stable';
}

interface AnalyticsCardProps {
  title: string;
  description?: string;
  value?: string | number;
  trend?: TrendData;
  children?: React.ReactNode;
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  color?: string;
  dataLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
}

interface BarChartProps {
  data: ChartData[] | CategoryData[];
  height?: number;
  layout?: 'vertical' | 'horizontal';
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
}

interface PieChartProps {
  data: ChartData[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  colors?: string[];
}
```

## Testing

Run analytics tests:

```bash
npm run test -- src/features/analytics
```

Note: recharts components are mocked in tests since they don't render SVG in jsdom. Tests verify component mounting, prop handling, and user interactions.

Test mocks are configured in `src/test/setup.ts`:

```typescript
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  LineChart: () => null,
  BarChart: () => null,
  PieChart: () => null,
  // ... other recharts components
}));
```

## Best Practices

1. **Use ResponsiveContainer**: Always wrap charts in ResponsiveContainer for responsive sizing
2. **Provide accessible labels**: Use descriptive titles and labels for screen readers
3. **Color accessibility**: Use color combinations that meet WCAG contrast requirements
4. **Loading states**: Show skeleton placeholders while data loads
5. **Empty states**: Handle cases when no data is available
