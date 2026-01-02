# Trust Metrics Dashboard

Analytics dashboard and chart components for EATP trust metrics.

## Component Hierarchy

```
TrustMetricsDashboard
├── Header (Time Range Selector + Export Buttons)
├── Metric Cards Grid (4 cards)
│   ├── MetricCard (Trust Establishments)
│   ├── MetricCard (Active Delegations)
│   ├── MetricCard (Verification Success Rate)
│   └── MetricCard (Audit Events)
├── Charts Grid
│   ├── TrustActivityChart (full width)
│   ├── DelegationDistributionChart (half width)
│   ├── TopCapabilitiesChart (half width)
│   └── ConstraintViolationsChart (full width)
```

## Components

### TrustMetricsDashboard
Main dashboard component that orchestrates all child components.

**Props**:
- `onMetricClick?: (metric: string) => void` - Callback when metric card is clicked

**Features**:
- Time range selection (24h, 7d, 30d, 90d)
- Export to CSV/JSON
- Responsive grid layout
- Loading states
- Error handling

### MetricCard
Individual metric display with trend indicator.

**Props**:
- `title: string` - Metric title
- `value: string | number` - Metric value
- `trend?: number` - Percentage change from previous period
- `suffix?: string` - Optional suffix (e.g., "%")
- `isLoading?: boolean` - Loading state
- `onClick?: () => void` - Click handler
- `className?: string` - Additional CSS classes

**Features**:
- Trend arrows (up/down/neutral)
- Color-coded trends (green/red/gray)
- Clickable for drill-down
- Loading skeleton

### TrustActivityChart
Line chart showing trust activity over time.

**Props**:
- `data: ActivityDataPoint[]` - Time series data
- `isLoading?: boolean` - Loading state

**Features**:
- Multi-series line chart (establishments, delegations, revocations, verifications)
- Interactive series toggles
- Tooltips
- Responsive sizing
- Dark mode support

### DelegationDistributionChart
Donut chart showing delegation distribution.

**Props**:
- `data: DistributionItem[]` - Distribution data
- `isLoading?: boolean` - Loading state
- `onSegmentClick?: (item: DistributionItem) => void` - Segment click handler

**Features**:
- Donut chart with center space
- Interactive segments
- Color-coded segments
- Percentage labels
- Legend with percentages

### TopCapabilitiesChart
Horizontal bar chart showing top capabilities by usage.

**Props**:
- `data: CapabilityUsage[]` - Capability usage data
- `isLoading?: boolean` - Loading state

**Features**:
- Horizontal bars
- Usage count and percentage
- Responsive sizing
- Dark mode support

### ConstraintViolationsChart
Stacked bar chart showing constraint violations over time.

**Props**:
- `data: ViolationDataPoint[]` - Violation data
- `isLoading?: boolean` - Loading state

**Features**:
- Stacked bars (5 violation types)
- Color-coded violation types
- Tooltips
- Responsive sizing

## Usage

```typescript
import { TrustMetricsDashboard } from "@/features/trust/components/TrustMetrics";

function MetricsPage() {
  const handleMetricClick = (metric: string) => {
    // Navigate to detailed view
    router.push(`/trust/metrics/${metric}`);
  };

  return (
    <div className="container mx-auto py-6">
      <TrustMetricsDashboard onMetricClick={handleMetricClick} />
    </div>
  );
}
```

## Data Flow

1. **TrustMetricsDashboard** computes `timeRange` based on selected preset
2. Calls `useTrustMetrics(timeRange)` hook
3. Hook calls API: `GET /api/v1/trust/metrics?start=...&end=...&preset=...`
4. API returns `TrustMetrics` object with all data
5. Dashboard passes data to child chart components
6. Charts render using recharts library

## Export Flow

1. User clicks "Export CSV" or "Export JSON"
2. `useExportMetrics()` mutation is triggered
3. API call: `GET /api/v1/trust/metrics/export?format=csv&start=...&end=...`
4. API returns Blob
5. Blob is downloaded as file with name `trust-metrics-{preset}.{format}`
6. Toast notification shows success/error

## Responsive Breakpoints

- **Mobile** (< 768px): 1 column grid
- **Tablet** (768px - 1024px): 2 column grid
- **Desktop** (> 1024px): 4 column grid

## Dark Mode

All components use CSS variables for theming:
- `hsl(var(--card))` - Card background
- `hsl(var(--border))` - Borders
- `hsl(var(--foreground))` - Text color
- `hsl(var(--muted-foreground))` - Muted text
- `hsl(var(--radius))` - Border radius

## Dependencies

- **recharts**: ^3.5.1 - Chart library
- **@tanstack/react-query**: Data fetching and caching
- **shadcn/ui**: UI components (Card, Button, Select, Skeleton, etc.)
- **lucide-react**: Icons

## File Structure

```
TrustMetrics/
├── TrustMetricsDashboard.tsx   # Main dashboard component
├── MetricCard.tsx               # Individual metric card
├── TrustActivityChart.tsx       # Line chart for activity
├── DelegationDistributionChart.tsx  # Donut chart for distribution
├── TopCapabilitiesChart.tsx     # Horizontal bar chart
├── ConstraintViolationsChart.tsx # Stacked bar chart
├── index.ts                     # Barrel exports
└── README.md                    # This file
```

## Backend API Contract

See `TRUST_METRICS_IMPLEMENTATION_SUMMARY.md` for complete API specification.

## Testing

Tests have not been written yet. Will be added in separate task.

## Notes

- All components are TypeScript strict mode compliant
- All components support dark mode
- All components are responsive
- All charts use recharts library
- Export functionality uses Blob API for downloads
- Time range is computed client-side from preset
