# Compliance Monitoring

The Compliance feature provides enterprise-wide monitoring of trust health, constraint violations, and audit trails. It helps Level 3 users maintain governance and ensure trust relationships remain healthy.

## What It Is

Compliance monitoring tracks:
- **Trust Health**: Distribution of valid, expiring, expired, and revoked trust relationships
- **Constraint Violations**: Instances where trust constraints were exceeded
- **Audit Events**: Complete history of trust operations
- **Alerts**: Real-time notifications for compliance issues

## Core Types

```typescript
// Trust health metrics
interface TrustHealthMetrics {
  valid: number;
  expiring: number;
  expired: number;
  revoked: number;
  total: number;
  percentage: number;
}

// Constraint violation record
interface ConstraintViolation {
  id: string;
  timestamp: string;
  constraintType: string;
  limit: string;
  actual: string;
  userId: string;
  userName: string;
  workUnitId: string;
  workUnitName: string;
  departmentId: string;
  departmentName: string;
  severity: 'warning' | 'error' | 'critical';
  resolved: boolean;
}

// Audit event types
type AuditEventType =
  | 'ESTABLISH'   // Trust established
  | 'DELEGATE'    // Delegation created
  | 'REVOKE'      // Trust revoked
  | 'VERIFY'      // Trust verified
  | 'VIOLATION'   // Constraint violation
  | 'RENEW'       // Trust renewed
  | 'EXPIRE';     // Trust expired

// Audit event record
interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  description: string;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  departmentId?: string;
  departmentName?: string;
  valueChainId?: string;
  valueChainName?: string;
  metadata?: Record<string, unknown>;
}

// Compliance alert
interface ComplianceAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  link?: string;
}
```

## Components

### TrustHealthBar
Stacked horizontal bar showing trust health distribution.

```tsx
import { TrustHealthBar } from '@/features/compliance/components';

<TrustHealthBar
  valid={80}
  expiring={10}
  expired={5}
  revoked={5}
  showLegend={true}
  showPercentage={true}
  animate={true}
/>
```

Props:
- `valid`, `expiring`, `expired`, `revoked`: Count for each status
- `showLegend`: Show color-coded legend (default: true)
- `showPercentage`: Show health percentage (default: true)
- `animate`: Enable animation (default: true)

### ConstraintViolationsChart
Weekly bar chart showing constraint violation trends.

```tsx
import { ConstraintViolationsChart } from '@/features/compliance/components';

<ConstraintViolationsChart
  data={weeklyViolations}
  onWeekClick={(week) => handleDrillDown(week)}
/>
```

Props:
- `data`: Array of `WeeklyViolations` objects
- `onWeekClick`: Callback when a week bar is clicked

### RecentAuditEvents
List of recent audit events with type badges.

```tsx
import { RecentAuditEvents } from '@/features/compliance/components';

<RecentAuditEvents
  events={auditEvents}
  maxItems={5}
  onViewAll={() => navigate('/govern/audit-trail')}
/>
```

### ComplianceAlerts
Alert cards with severity indicators and actions.

```tsx
import { ComplianceAlerts } from '@/features/compliance/components';

<ComplianceAlerts
  alerts={alerts}
  onAcknowledge={(id) => acknowledgeAlert(id)}
  onViewDetails={(id) => navigate(`/alerts/${id}`)}
/>
```

## Pages

### ComplianceDashboard (`/govern/compliance`)
Full compliance monitoring dashboard combining all components.

```tsx
import { ComplianceDashboard } from '@/pages/govern';

// Access via route: /govern/compliance
```

### EnterpriseAuditTrail (`/govern/audit-trail`)
Complete audit trail with filtering and export.

```tsx
import { EnterpriseAuditTrail } from '@/pages/govern';

// Features:
// - Filter by event type
// - Date range selection
// - Text search
// - Pagination
// - Export to CSV/PDF
// - Expandable event details
```

## Hooks

```typescript
import {
  useComplianceDashboard,
  useTrustHealth,
  useConstraintViolations,
  useAuditEvents,
  useAcknowledgeAlert,
  useExportComplianceReport,
  useExportAuditTrail,
} from '@/features/compliance';

// Fetch compliance dashboard data
const { data: dashboard } = useComplianceDashboard({
  departmentId: 'dept-1',
});

// Fetch trust health metrics
const { data: health } = useTrustHealth();

// Fetch audit events with pagination
const { data: events } = useAuditEvents(
  { type: 'ESTABLISH' }, // filter
  1,                      // page
  20                      // pageSize
);

// Acknowledge an alert
const acknowledgeMutation = useAcknowledgeAlert();
acknowledgeMutation.mutate('alert-1');

// Export audit trail
const exportMutation = useExportAuditTrail();
exportMutation.mutate({
  filter: { type: 'all' },
  format: 'csv',
});
```

## Usage Example

```tsx
import {
  useTrustHealth,
  useConstraintViolations,
  useAuditEvents,
} from '@/features/compliance';
import {
  TrustHealthBar,
  ConstraintViolationsChart,
  RecentAuditEvents,
} from '@/features/compliance/components';

function ComplianceDashboard() {
  const { data: health } = useTrustHealth();
  const { data: violations } = useConstraintViolations();
  const { data: events } = useAuditEvents(undefined, 1, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trust Health</CardTitle>
        </CardHeader>
        <CardContent>
          {health && (
            <TrustHealthBar
              valid={health.valid}
              expiring={health.expiring}
              expired={health.expired}
              revoked={health.revoked}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Constraint Violations</CardTitle>
        </CardHeader>
        <CardContent>
          {violations && (
            <ConstraintViolationsChart data={violations.weekly} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events && (
            <RecentAuditEvents events={events.events} maxItems={5} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```
