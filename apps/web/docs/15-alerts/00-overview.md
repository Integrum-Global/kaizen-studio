# Alerts Management

The Alerts feature provides a comprehensive system for monitoring, acknowledging, and managing alerts and alert rules.

## Feature Location

```
src/features/alerts/
├── api/
│   └── alerts.ts           # Alert API client
├── components/
│   ├── AlertCard.tsx       # Individual alert display
│   ├── AlertHistory.tsx    # Alert occurrence history
│   ├── AlertList.tsx       # Paginated alert list
│   ├── AlertRuleBuilder.tsx # Rule creation form
│   ├── AlertRuleList.tsx   # Rule management list
│   └── __tests__/          # Component tests
├── hooks/
│   └── useAlerts.ts        # React Query hooks
├── types/
│   └── index.ts            # TypeScript definitions
└── index.ts                # Barrel exports
```

## Components

### AlertList

Paginated list of alerts with filtering.

```tsx
import { AlertList } from '@/features/alerts';

<AlertList
  filters={{
    severity: 'critical',
    status: 'active',
  }}
  onAlertClick={(alert) => openAlertDetails(alert)}
/>
```

### AlertCard

Individual alert display with actions.

```tsx
import { AlertCard } from '@/features/alerts';

<AlertCard
  alert={{
    id: 'alert-1',
    name: 'High CPU Usage',
    severity: 'critical',
    status: 'active',
    metric: 'cpu_usage',
    threshold: 90,
    current_value: 95,
    triggered_at: '2024-01-15T10:30:00Z',
  }}
  onAcknowledge={(id) => acknowledgeAlert(id)}
  onResolve={(id) => resolveAlert(id)}
  onClick={() => openDetails()}
/>
```

### AlertRuleBuilder

Interactive rule configuration form.

```tsx
import { AlertRuleBuilder } from '@/features/alerts';

<AlertRuleBuilder
  metric="cpu_usage"
  operator="gt"
  threshold={80}
  duration={300}
  severity="warning"
  onMetricChange={(m) => setMetric(m)}
  onOperatorChange={(o) => setOperator(o)}
  onThresholdChange={(t) => setThreshold(t)}
  onDurationChange={(d) => setDuration(d)}
  onSeverityChange={(s) => setSeverity(s)}
/>
```

### AlertRuleList

Management interface for alert rules.

```tsx
import { AlertRuleList } from '@/features/alerts';

<AlertRuleList
  onEditRule={(rule) => openRuleEditor(rule)}
  onToggleRule={(id) => toggleRuleEnabled(id)}
  onDeleteRule={(id) => deleteRule(id)}
/>
```

### AlertHistory

Historical view of alert occurrences.

```tsx
import { AlertHistory } from '@/features/alerts';

<AlertHistory alertId="alert-1" maxItems={20} />
```

## Hooks

### useAlerts

Fetch alerts with filtering and pagination.

```tsx
import { useAlerts } from '@/features/alerts';

const { data, isLoading, refetch } = useAlerts({
  severity: 'critical',
  status: 'active',
  page: 1,
  page_size: 12,
});
```

### useAlert

Fetch single alert by ID.

```tsx
import { useAlert } from '@/features/alerts';

const { data: alert, isLoading } = useAlert('alert-123');
```

### useAlertRules

Fetch alert rules with filtering.

```tsx
import { useAlertRules } from '@/features/alerts';

const { data, isLoading } = useAlertRules({
  metric: 'cpu_usage',
  enabled: true,
});
```

### Mutations

```tsx
import {
  useAcknowledgeAlert,
  useResolveAlert,
  useCreateAlertRule,
  useUpdateAlertRule,
  useDeleteAlertRule,
  useToggleAlertRule,
} from '@/features/alerts';

// Acknowledge an alert
const acknowledgeMutation = useAcknowledgeAlert();
acknowledgeMutation.mutate({ id: 'alert-1', message: 'Investigating' });

// Create a new rule
const createRuleMutation = useCreateAlertRule();
createRuleMutation.mutate({
  name: 'High CPU Alert',
  metric: 'cpu_usage',
  operator: 'gt',
  threshold: 80,
  duration: 300,
  severity: 'warning',
});
```

## Types

```typescript
interface Alert {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  metric: AlertMetric;
  condition: string;
  threshold: number;
  current_value: number;
  rule_id?: string;
  triggered_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: AlertMetric;
  operator: AlertOperator;
  threshold: number;
  duration: number;
  severity: AlertSeverity;
  enabled: boolean;
}

type AlertSeverity = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'resolved' | 'acknowledged';
type AlertMetric = 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'response_time' | 'error_rate';
type AlertOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
```

## Alert Severities

| Severity | Color | Description |
|----------|-------|-------------|
| Critical | Red | Immediate attention required |
| Warning | Yellow | Potential issue, monitor closely |
| Info | Blue | Informational, no action needed |

## Testing

Run alerts tests:

```bash
npm run test -- src/features/alerts
```

Test coverage includes:
- AlertCard rendering and actions
- AlertList pagination
- AlertRuleBuilder form validation
- Alert mutation hooks
- Filter state management
