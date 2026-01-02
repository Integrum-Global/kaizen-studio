# Health Monitoring Feature

Comprehensive system health monitoring for Kaizen Studio with real-time status updates, service tracking, and incident management.

## Features

- **Real-time Health Monitoring**: Auto-refreshing service status (30s polling interval)
- **System Overview**: Aggregated health metrics and performance indicators
- **Service Status Cards**: Individual service health with latency and uptime
- **Incident Management**: Track active and resolved incidents
- **Uptime Visualization**: Historical uptime and latency charts
- **Visual Indicators**: Color-coded health status (green/yellow/red)
- **Responsive Design**: Mobile-first layout with Tailwind CSS
- **Dark Mode Support**: Full dark mode compatibility

## Architecture

```
health/
├── types/              # TypeScript interfaces
│   ├── health.ts       # Health monitoring types
│   └── index.ts
├── api/                # API layer with mocked data
│   ├── health.ts       # healthApi with mock responses
│   └── index.ts
├── hooks/              # React Query hooks
│   ├── useHealth.ts    # Hooks for health data fetching
│   └── index.ts
├── components/         # React components
│   ├── HealthDashboard.tsx      # Main dashboard
│   ├── HealthIndicator.tsx      # Status indicators
│   ├── ServiceStatus.tsx        # Service cards
│   ├── ServiceList.tsx          # List of services
│   ├── UptimeChart.tsx          # Uptime visualizations
│   ├── IncidentList.tsx         # Incident tracking
│   ├── __tests__/               # Vitest tests
│   │   ├── HealthDashboard.test.tsx
│   │   ├── HealthIndicator.test.tsx
│   │   ├── IncidentList.test.tsx
│   │   └── ServiceStatus.test.tsx
│   └── index.ts
└── index.ts            # Barrel export
```

## Types

### ServiceHealth

```typescript
interface ServiceHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number; // in milliseconds
  uptime: number; // percentage (0-100)
  lastCheck: string; // ISO timestamp
  description?: string;
  endpoint?: string;
}
```

### Incident

```typescript
interface Incident {
  id: string;
  serviceId: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  startedAt: string; // ISO timestamp
  resolvedAt?: string; // ISO timestamp, null if ongoing
  description: string;
  affectedUsers?: number;
}
```

### SystemHealth

```typescript
interface SystemHealth {
  overallStatus: "healthy" | "degraded" | "down";
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  averageLatency: number;
  averageUptime: number;
  lastUpdated: string;
}
```

## API Layer

The `healthApi` provides mocked endpoints for development:

```typescript
import { healthApi } from "@/features/health";

// Get system-wide health overview
const systemHealth = await healthApi.getSystemHealth();

// Get all services with optional filters
const services = await healthApi.getAllServices({
  status: "healthy",
  search: "api",
});

// Get single service by ID
const service = await healthApi.getServiceById("service-id");

// Get health check history
const checks = await healthApi.getHealthChecks("service-id");

// Get incidents
const incidents = await healthApi.getIncidents();

// Get uptime data for charts
const uptimeData = await healthApi.getUptimeData("service-id", 24);
```

## React Query Hooks

### useSystemHealth

```typescript
import { useSystemHealth } from "@/features/health";

function Component() {
  const { data, isPending, error } = useSystemHealth(30000); // 30s polling
  // data: SystemHealth
}
```

### useServices

```typescript
import { useServices } from "@/features/health";

function Component() {
  const { data, isPending } = useServices(
    { status: "healthy" }, // filters
    30000 // polling interval
  );
  // data: ServiceHealth[]
}
```

### useIncidents

```typescript
import { useIncidents } from "@/features/health";

function Component() {
  const { data, isPending } = useIncidents({
    search: "database",
    startDate: "2024-01-01",
  });
  // data: Incident[]
}
```

### useUptimeData

```typescript
import { useUptimeData } from "@/features/health";

function Component() {
  const { data } = useUptimeData("service-id", 24); // 24 hours
  // data: UptimeDataPoint[]
}
```

## Components

### HealthDashboard

Main dashboard component with system overview and service grid.

```tsx
import { HealthDashboard } from "@/features/health";

function App() {
  return <HealthDashboard />;
}
```

### HealthIndicator

Visual status indicator with multiple variants.

```tsx
import { HealthIndicator } from '@/features/health';

// Badge with icon
<HealthIndicator status="healthy" size="md" showLabel />

// Compact dot
<HealthDot status="degraded" />

// Pulsing indicator for real-time
<HealthPulse status="down" />
```

### ServiceStatus

Service health card with metrics.

```tsx
import { ServiceStatus } from '@/features/health';

<ServiceStatus
  service={serviceData}
  onClick={() => console.log('Clicked')}
/>

// Compact version
<ServiceStatusCompact service={serviceData} />
```

### ServiceList

Filterable list of all services.

```tsx
import { ServiceList } from "@/features/health";

<ServiceList />;
// Includes search, filters, and auto-refresh
```

### UptimeChart

Visualizes uptime and latency history.

```tsx
import { UptimeChart } from "@/features/health";

<UptimeChart serviceId="service-1" serviceName="API Service" hours={24} />;
```

### IncidentList

Displays recent incidents with severity badges.

```tsx
import { IncidentList } from "@/features/health";

<IncidentList maxItems={5} />;
```

## Styling

All components use Tailwind CSS with shadcn/ui primitives:

- **Card**: Service and metric containers
- **Badge**: Status and severity indicators
- **Button**: Action buttons
- **Input**: Search fields
- **Select**: Filter dropdowns
- **Skeleton**: Loading states

### Color Coding

- **Green**: Healthy status (text-green-500)
- **Yellow**: Degraded status (text-yellow-500)
- **Red**: Down status (text-red-500)
- **Blue**: Low severity incidents
- **Orange**: Medium/high severity
- **Red**: Critical incidents

## Real-Time Updates

Components automatically refresh data:

- System health: 30s intervals
- Service status: 30s intervals
- Incidents: 60s intervals
- Health checks: On demand (1m stale time)
- Uptime data: On demand (5m stale time)

Customize polling intervals:

```typescript
const { data } = useSystemHealth(10000); // 10s polling
```

## Testing

Comprehensive vitest tests included:

```bash
# Run all health feature tests
npm test src/features/health

# Run specific test file
npm test HealthDashboard.test.tsx

# Run with coverage
npm run test:coverage -- src/features/health
```

Test utilities provided:

- Mock service data
- Mock incident data
- QueryClient setup
- Loading state tests
- Error state tests
- User interaction tests

## Mock Data

The API layer provides realistic mock data:

- **6 Services**: Mix of healthy, degraded, and down
- **3 Incidents**: Active and resolved
- **24 Hours**: Uptime history data
- **Auto-generated**: Health check history

Mock services include:

- Kaizen API
- Nexus Gateway
- DataFlow Database
- Workflow Engine
- MCP Server
- Redis Cache

## Usage Example

```tsx
import { HealthDashboard } from "@/features/health";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthDashboard />
    </QueryClientProvider>
  );
}
```

## Performance Considerations

- **Automatic polling**: Services refetch every 30s
- **Stale-while-revalidate**: Shows cached data during refetch
- **No retries**: Failed requests don't retry automatically
- **Optimistic updates**: Instant UI feedback
- **Memoization**: React 19 compiler handles optimization

## Accessibility

- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color blind safe (icons + colors)
- Focus indicators

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Email/Slack notifications for incidents
- [ ] Historical data export
- [ ] Custom alert thresholds
- [ ] Service dependency graphs
- [ ] SLA tracking and reporting
- [ ] Multi-region support
- [ ] Performance trend analysis

## Related Features

- **Deployments**: Monitor deployed services
- **Metrics**: Detailed performance metrics
- **Audit**: Track health-related events
- **Alerts**: Notification system integration

## Support

For issues or questions, refer to:

- Main documentation: `/docs`
- Component examples: `/src/features/health/components`
- Test files: `/src/features/health/components/__tests__`
