# Health Monitoring

The Health Monitoring feature provides real-time visibility into system health, service status, and incident tracking.

## Feature Location

```
src/features/health/
├── api/
│   └── health.ts           # Health API client
├── components/
│   ├── HealthDashboard.tsx # Main health overview
│   ├── HealthIndicator.tsx # Status badge component
│   ├── IncidentList.tsx    # Incident history
│   ├── ServiceStatus.tsx   # Service health card
│   └── __tests__/          # Component tests
├── hooks/
│   └── useHealth.ts        # React Query hooks
├── types/
│   └── index.ts            # TypeScript definitions
└── index.ts                # Barrel exports
```

## Components

### HealthDashboard

Main dashboard showing overall system health.

```tsx
import { HealthDashboard } from '@/features/health';

function StatusPage() {
  return <HealthDashboard />;
}
```

### ServiceStatus

Individual service health display.

```tsx
import { ServiceStatus, ServiceStatusCompact } from '@/features/health';

// Full card view
<ServiceStatus
  service={{
    id: 'api-server',
    name: 'API Server',
    description: 'Main REST API',
    status: 'healthy',
    latency: 45,
    uptime: 99.9,
    lastCheck: '2024-01-15T10:30:00Z',
    endpoint: 'https://api.example.com',
  }}
  onClick={() => openServiceDetails('api-server')}
/>

// Compact view for lists
<ServiceStatusCompact service={service} />
```

### HealthIndicator

Status badge with color and text.

```tsx
import { HealthIndicator } from '@/features/health';

<HealthIndicator status="healthy" />
<HealthIndicator status="degraded" />
<HealthIndicator status="down" size="sm" />
```

### IncidentList

Recent incidents with severity and resolution status.

```tsx
import { IncidentList } from '@/features/health';

<IncidentList maxItems={5} />
```

## Hooks

### useSystemHealth

Fetch overall system health status.

```tsx
import { useSystemHealth } from '@/features/health';

const { data, isLoading, error } = useSystemHealth();
// Returns: { status, services, lastUpdated }
```

### useServiceHealth

Fetch health for a specific service.

```tsx
import { useServiceHealth } from '@/features/health';

const { data: service, isLoading } = useServiceHealth('api-server');
```

### useIncidents

Fetch recent incidents.

```tsx
import { useIncidents } from '@/features/health';

const { data: incidents, isLoading } = useIncidents();
```

## Types

```typescript
interface SystemHealth {
  status: HealthStatus;
  services: ServiceHealth[];
  lastUpdated: string;
}

interface ServiceHealth {
  id: string;
  name: string;
  description?: string;
  status: HealthStatus;
  latency: number;
  uptime: number;
  lastCheck: string;
  endpoint?: string;
}

interface Incident {
  id: string;
  serviceId: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  startedAt: string;
  resolvedAt?: string;
  affectedUsers?: number;
}

type HealthStatus = 'healthy' | 'degraded' | 'down';
type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
```

## Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Healthy | Green | Operating normally |
| Degraded | Yellow | Experiencing issues |
| Down | Red | Service unavailable |

## Incident Severity

| Severity | Badge Color | Impact |
|----------|-------------|--------|
| Critical | Red | Complete service outage |
| High | Orange | Major functionality affected |
| Medium | Yellow | Partial service degradation |
| Low | Blue | Minor issues, workaround available |

## Usage Examples

### Status Page

```tsx
import { HealthDashboard } from '@/features/health';

export function StatusPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">System Status</h1>
      <HealthDashboard />
    </div>
  );
}
```

### Compact Status in Header

```tsx
import { useSystemHealth, HealthIndicator } from '@/features/health';

function HeaderStatus() {
  const { data } = useSystemHealth();

  return (
    <div className="flex items-center gap-2">
      <HealthIndicator status={data?.status ?? 'healthy'} size="sm" />
      <span className="text-sm">All systems operational</span>
    </div>
  );
}
```

### Service Grid

```tsx
import { useSystemHealth, ServiceStatusCompact } from '@/features/health';

function ServiceGrid() {
  const { data } = useSystemHealth();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data?.services.map((service) => (
        <ServiceStatusCompact key={service.id} service={service} />
      ))}
    </div>
  );
}
```

## Testing

Run health tests:

```bash
npm run test -- src/features/health
```

Test coverage includes:
- HealthIndicator status rendering
- ServiceStatus card display
- IncidentList loading and filtering
- Health hook data fetching
- Time formatting utilities
