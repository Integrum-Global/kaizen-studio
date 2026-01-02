# Performance Monitoring Feature

## Overview

The performance feature provides Web Vitals monitoring, component performance measurement, and visual indicators for tracking application performance metrics.

## Directory Structure

```
src/features/performance/
├── types/
│   └── index.ts              # MetricName, PerformanceMetric, etc.
├── hooks/
│   ├── usePerformance.ts     # Web Vitals monitoring hook
│   ├── useComponentPerformance.ts  # Component timing hooks
│   └── index.ts
├── utils/
│   ├── thresholds.ts         # Default thresholds and helpers
│   ├── webVitals.ts          # Web Vitals initialization
│   └── index.ts
├── components/
│   ├── PerformanceIndicator.tsx  # Visual metric indicators
│   └── index.ts
├── __tests__/                # 98 tests total
│   ├── thresholds.test.ts
│   ├── usePerformance.test.ts
│   ├── useComponentPerformance.test.ts
│   └── PerformanceIndicator.test.tsx
└── index.ts
```

## Types

### MetricName

```typescript
type MetricName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";
```

### MetricRating

```typescript
type MetricRating = "good" | "needs-improvement" | "poor";
```

### PerformanceMetric

```typescript
interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: MetricRating;
  delta: number;
  id: string;
  navigationType: "navigate" | "reload" | "back-forward" | "prerender";
  entries: PerformanceEntry[];
}
```

### PerformanceThresholds

```typescript
interface PerformanceThresholds {
  LCP: { good: number; poor: number };  // 2500ms / 4000ms
  FID: { good: number; poor: number };  // 100ms / 300ms
  CLS: { good: number; poor: number };  // 0.1 / 0.25
  INP: { good: number; poor: number };  // 200ms / 500ms
  FCP: { good: number; poor: number };  // 1800ms / 3000ms
  TTFB: { good: number; poor: number }; // 800ms / 1800ms
}
```

## Hooks

### usePerformance

Monitor Web Vitals metrics application-wide.

```tsx
import { usePerformance } from "@/features/performance";

function App() {
  const { metrics, score, isCollecting, getReport } = usePerformance({
    debug: process.env.NODE_ENV === "development",
    reportEndpoint: "/api/metrics",
  });

  return (
    <div>
      <p>Performance Score: {score}</p>
      {metrics.LCP && <p>LCP: {metrics.LCP.value}ms ({metrics.LCP.rating})</p>}
      {metrics.INP && <p>INP: {metrics.INP.value}ms ({metrics.INP.rating})</p>}
    </div>
  );
}
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `debug` | boolean | Log metrics to console |
| `reportEndpoint` | string | URL to send metrics |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `metrics` | Record<MetricName, PerformanceMetric> | Collected metrics |
| `score` | number | Overall score (0-100) |
| `isCollecting` | boolean | Whether still collecting |
| `getReport` | () => PerformanceReport | Get full report |

### useComponentPerformance

Measure individual component render performance.

```tsx
import { useComponentPerformance } from "@/features/performance";

function ExpensiveComponent() {
  const { renderTime, mountTime, renderCount } = useComponentPerformance("ExpensiveComponent");

  // Logs slow renders (>16ms) in development
  // Marks component mount in Performance API

  return (
    <div>
      <p>Render #{renderCount}: {renderTime.toFixed(2)}ms</p>
      {mountTime && <p>Mount time: {mountTime.toFixed(2)}ms</p>}
    </div>
  );
}
```

### useAsyncPerformance

Measure async operation duration.

```tsx
import { useAsyncPerformance } from "@/features/performance";

function DataFetcher() {
  const { startMeasure, endMeasure, duration, isRunning } = useAsyncPerformance("fetchData");

  const fetchData = async () => {
    startMeasure();
    try {
      await api.getData();
    } finally {
      endMeasure();
    }
  };

  return (
    <div>
      {isRunning && <p>Loading...</p>}
      {duration && <p>Last fetch: {duration.toFixed(2)}ms</p>}
      <button onClick={fetchData}>Fetch</button>
    </div>
  );
}
```

## Components

### PerformanceIndicator

Display a single metric with visual feedback.

```tsx
import { PerformanceIndicator } from "@/features/performance";

<PerformanceIndicator
  metric={metrics.LCP}
  showDescription={true}
  compact={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `metric` | PerformanceMetric | required | Metric to display |
| `showDescription` | boolean | false | Show metric description |
| `compact` | boolean | false | Compact display mode |
| `className` | string | - | Additional classes |

### PerformanceScore

Circular score indicator.

```tsx
import { PerformanceScore } from "@/features/performance";

<PerformanceScore score={85} size="md" />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | number | required | Score (0-100) |
| `size` | "sm" \| "md" \| "lg" | "md" | Size variant |
| `className` | string | - | Additional classes |

### PerformancePanel

Full panel displaying all metrics.

```tsx
import { PerformancePanel } from "@/features/performance";

<PerformancePanel
  metrics={metrics}
  score={score}
  isCollecting={isCollecting}
/>
```

## Utilities

### initWebVitals

Initialize Web Vitals monitoring manually.

```typescript
import { initWebVitals } from "@/features/performance";

initWebVitals({
  debug: true,
  onMetric: (metric) => {
    console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
  },
  reportEndpoint: "/api/metrics",
});
```

### Threshold Utilities

```typescript
import {
  DEFAULT_THRESHOLDS,
  getMetricRating,
  getRatingColor,
  getMetricDescription,
  formatMetricValue,
  calculatePerformanceScore,
} from "@/features/performance";

// Get rating for a value
const rating = getMetricRating("LCP", 2500); // "good"

// Get color for rating
const color = getRatingColor("good"); // "green"

// Format metric value
const formatted = formatMetricValue("LCP", 2500); // "2500ms"
const clsFormatted = formatMetricValue("CLS", 0.1); // "0.100"

// Calculate overall score
const score = calculatePerformanceScore({
  LCP: { value: 2000, rating: "good" },
  INP: { value: 150, rating: "good" },
}); // 100
```

### Performance API Utilities

```typescript
import {
  markPerformance,
  measurePerformance,
  measureBetweenMarks,
  getPerformanceMetrics,
} from "@/features/performance";

// Create a mark
markPerformance("myOperation-start");

// Get mark timing
const startTime = measurePerformance("myOperation-start");

// Measure between marks
markPerformance("myOperation-end");
const duration = measureBetweenMarks(
  "myOperation",
  "myOperation-start",
  "myOperation-end"
);

// Get raw performance metrics
const { navigationTiming, paintTiming, resourceTiming } = getPerformanceMetrics();
```

## Web Vitals Metrics

| Metric | Name | Good | Poor | Description |
|--------|------|------|------|-------------|
| LCP | Largest Contentful Paint | ≤2.5s | >4s | Loading performance |
| FID | First Input Delay | ≤100ms | >300ms | Interactivity |
| CLS | Cumulative Layout Shift | ≤0.1 | >0.25 | Visual stability |
| INP | Interaction to Next Paint | ≤200ms | >500ms | Responsiveness |
| FCP | First Contentful Paint | ≤1.8s | >3s | Initial render |
| TTFB | Time to First Byte | ≤800ms | >1.8s | Server response |

## Best Practices

1. **Initialize early**: Call `usePerformance` in your root component to capture all metrics
2. **Use debug mode in development**: Helps identify performance issues early
3. **Monitor specific components**: Use `useComponentPerformance` for known expensive components
4. **Track async operations**: Use `useAsyncPerformance` for API calls and data processing
5. **Report to backend**: Configure `reportEndpoint` for production monitoring
6. **Set custom thresholds**: Override defaults based on your application's requirements

## Testing

98 tests covering:
- Threshold calculations and ratings
- Hook initialization and state management
- Component rendering and interactions
- Accessibility attributes
- Edge cases (0 values, boundary conditions)

Run tests:
```bash
npm run test src/features/performance
```

## Usage Example

```tsx
import {
  usePerformance,
  PerformancePanel,
} from "@/features/performance";

function Dashboard() {
  const { metrics, score, isCollecting } = usePerformance({ debug: true });

  return (
    <div className="p-4">
      <h1>Dashboard</h1>

      {/* Show performance panel in development */}
      {process.env.NODE_ENV === "development" && (
        <PerformancePanel
          metrics={metrics}
          score={score}
          isCollecting={isCollecting}
          className="mb-4"
        />
      )}

      {/* Rest of dashboard content */}
    </div>
  );
}
```

## Integration with Main App

Initialize Web Vitals monitoring in your app entry point:

```tsx
// main.tsx
import { initWebVitals } from "@/features/performance";

// Initialize Web Vitals in production
if (process.env.NODE_ENV === "production") {
  initWebVitals({
    reportEndpoint: import.meta.env.VITE_METRICS_ENDPOINT,
  });
}
```
