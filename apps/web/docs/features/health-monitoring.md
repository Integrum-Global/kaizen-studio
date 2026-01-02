# Health Monitoring Feature

The Health Monitoring feature provides real-time visibility into system health, service status, and incident history for the Kaizen Studio platform.

## Overview

The health monitoring dashboard displays:
- **Overall System Status**: A quick glance at whether all services are healthy
- **Service Status Cards**: Individual cards for each monitored service (API, Database, Redis)
- **Performance Metrics**: Response times, error rates, request counts, CPU/memory usage
- **Dependency Status**: Health checks for external and internal dependencies
- **Incident Timeline**: Historical view of incidents and outages

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/system-health` | HealthPage | Main health dashboard |
| `/system-health/incidents` | IncidentsPage | Incident history view |

## Components

### HealthDashboard
The main dashboard component that orchestrates the health monitoring view.

Features:
- Auto-refresh toggle (30-second interval when enabled)
- Manual refresh button
- Export functionality (JSON, CSV, PDF formats)
- Last updated timestamp with live indicator

### StatusIndicator
Visual indicator showing health status with color-coded badges:
- **Green**: Healthy/Operational
- **Yellow**: Degraded/Partial outage
- **Red**: Down/Unhealthy

### ServiceStatusCard
Individual service cards displaying:
- Service name and description
- Current status indicator
- Uptime percentage
- Response latency
- Last check timestamp

### HealthMetrics
Displays key performance metrics:
- Response time (avg, p95, p99)
- Error rate percentage
- Request count
- CPU usage percentage
- Memory usage percentage

### IncidentTimeline
Historical view of incidents showing:
- Incident title and severity
- Start and resolution times
- Duration
- Affected services
- Description

## Data Flow

The health feature uses mock data until a backend health API is implemented:

```typescript
// src/features/health/api/health.ts
export const healthApi = {
  getSystemHealth: async (): Promise<SystemHealth> => { ... },
  getIncidents: async (): Promise<Incident[]> => { ... },
  getIncident: async (id: string): Promise<Incident> => { ... },
  exportReport: async (format: ExportFormat): Promise<Blob> => { ... },
  getHealthReport: async (): Promise<HealthReport> => { ... },
};
```

## React Query Hooks

```typescript
// Available hooks from src/features/health/hooks
useSystemHealth(options?: { refetchInterval?: number; enabled?: boolean })
useIncidents()
useIncident(id: string)
useExportReport()
useHealthReport()
useRefreshHealth()
useServices(filters?: { search?: string; status?: string }, refetchInterval?: number)
useUptimeData(serviceId?: string, hours?: number | string)
```

## Types

Key TypeScript interfaces:

```typescript
type HealthStatus = "healthy" | "degraded" | "down" | "unhealthy";
type IncidentSeverity = "low" | "medium" | "high" | "critical";
type ExportFormat = "json" | "pdf" | "csv";

interface SystemHealth {
  status?: HealthStatus;
  totalServices: number;
  healthyServices: number;
  degradedServices: number;
  downServices: number;
  averageLatency: number;
  averageUptime: number;
  lastUpdated: string;
  services?: ServiceStatus[];
  metrics?: HealthMetrics;
  dependencies?: DependencyStatus[];
}
```

## Accessibility

The health dashboard implements several accessibility features:
- Proper heading hierarchy (h1 for page title, h2 for sections)
- ARIA live regions for status announcements
- Keyboard navigation support
- Color-independent status indicators (text labels accompany color)
- Focus management for interactive elements

## Testing

The health feature has comprehensive E2E tests covering:
- Dashboard header and overall status display
- Service status cards
- Status indicators (healthy, degraded, unhealthy)
- Performance metrics display
- Incident history
- Real-time updates and auto-refresh
- Export functionality
- Responsive design (mobile/desktop)
- Accessibility requirements

Run health tests:
```bash
npx playwright test e2e/health.spec.ts --project=chromium
```

## Future Enhancements

When implementing the backend health API, update `src/features/health/api/health.ts` to call actual API endpoints:

```typescript
getSystemHealth: async (): Promise<SystemHealth> => {
  const response = await apiClient.get<SystemHealth>("/api/v1/health");
  return response.data;
},
```
