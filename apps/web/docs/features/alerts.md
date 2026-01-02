# Alerts Feature

The Alerts feature provides comprehensive alert management, rule configuration, and notification channel integration for the Kaizen Studio platform.

## Overview

The alerts system enables:
- **Active Alerts**: View and manage current alerts by severity
- **Alert Rules**: Create and configure alert triggers and thresholds
- **Alert History**: Review resolved alerts and incident patterns
- **Notification Channels**: Configure email, Slack, webhook integrations

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/alerts` | AlertsPage | Main alerts dashboard with active alerts |
| `/alerts/rules` | AlertRulesPage | Alert rule configuration |
| `/alerts/history` | AlertHistoryPage | Historical alert view |
| `/alerts/history/:id` | AlertHistoryPage | Specific alert details |
| `/alerts/settings` | AlertSettingsPage | Notification channel settings |

## Components

### AlertsPage
The main alerts dashboard displaying active alerts.

Features:
- Alert list with severity indicators (critical, warning, info)
- Filter by severity and status
- Quick actions (acknowledge, resolve, silence)
- Create new alert rule button

### AlertRulesPage
Configure alert rules with conditions and actions.

Features:
- Rule list with conditions and thresholds
- Metric selection for triggers
- Threshold configuration
- Notification channel assignment

### AlertHistoryPage
Historical view of resolved alerts.

Features:
- Date range filtering
- Resolved alert list
- Alert duration and resolution details
- Export functionality

### AlertSettingsPage
Notification channel configuration.

Features:
- Email notification setup
- Slack integration
- Webhook configuration
- PagerDuty integration (planned)

## Severity Levels

Alerts support four severity levels with color-coded indicators:

| Severity | Color | Use Case |
|----------|-------|----------|
| Critical | Red | System down, immediate action required |
| Warning | Yellow/Orange | Degraded performance, attention needed |
| Info | Blue | Informational notifications |
| Low | Gray | Minor issues, no immediate action |

## Alert Actions

### Acknowledge
Mark an alert as acknowledged to indicate someone is investigating.

### Resolve
Close an alert when the underlying issue is fixed.

### Silence/Mute
Temporarily suppress notifications for a specific alert or rule.

## Data Flow

The alerts feature uses mock data until backend alert APIs are implemented:

```typescript
// src/features/alerts/api/alerts.ts
export const alertsApi = {
  getAlerts: async (filters?: AlertFilters): Promise<Alert[]> => { ... },
  getAlertRules: async (): Promise<AlertRule[]> => { ... },
  createRule: async (rule: CreateAlertRule): Promise<AlertRule> => { ... },
  acknowledgeAlert: async (id: string): Promise<Alert> => { ... },
  resolveAlert: async (id: string): Promise<Alert> => { ... },
  silenceAlert: async (id: string, duration: number): Promise<Alert> => { ... },
};
```

## Types

Key TypeScript interfaces:

```typescript
type AlertSeverity = "critical" | "warning" | "info" | "low";
type AlertStatus = "active" | "acknowledged" | "resolved" | "silenced";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  severity: AlertSeverity;
  channels: string[];
  enabled: boolean;
}

interface NotificationChannel {
  id: string;
  type: "email" | "slack" | "webhook" | "pagerduty";
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}
```

## Accessibility

The alerts feature implements accessibility requirements:
- Proper heading structure (h1 for page title, h2 for sections)
- Color-independent severity indicators (text labels accompany colors)
- Keyboard navigation for alert actions
- ARIA live regions for new alert announcements
- Focus management for dialogs and forms

## Testing

The alerts feature has comprehensive E2E tests covering:
- Alert list display and empty states
- Severity level filtering and display
- Alert rule management
- Create alert rule dialog
- Alert actions (acknowledge, resolve, silence)
- Notification channel configuration
- Alert history view
- Responsive design
- Accessibility requirements

Run alerts tests:
```bash
npx playwright test e2e/alerts.spec.ts --project=chromium
```

## Future Enhancements

When implementing the backend alerts API:

1. Update `src/features/alerts/api/alerts.ts` to call actual endpoints:
```typescript
getAlerts: async (filters?: AlertFilters): Promise<Alert[]> => {
  const response = await apiClient.get<Alert[]>("/api/v1/alerts", { params: filters });
  return response.data;
},
```

2. Add WebSocket support for real-time alert notifications
3. Implement alert grouping and correlation
4. Add alert templates for common scenarios
