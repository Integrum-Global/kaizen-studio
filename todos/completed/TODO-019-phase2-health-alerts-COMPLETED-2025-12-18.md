# TODO-019: Phase 2 - Health Dashboard and Alerts System

**Status**: ACTIVE
**Priority**: HIGH
**Owner**: Frontend Team
**Estimated Effort**: 5-6 days
**Created**: 2025-12-18

## Description

Implement the Health Dashboard (`/health`) and Alerts System (`/alerts`) pages to visualize system health metrics, service status, and alert management. These are critical observability features currently missing from the frontend.

## Target Impact

- Enable 33 health dashboard tests
- Enable 9 alerts system tests
- Total: 42 additional tests passing

## Acceptance Criteria

- [ ] Health Dashboard page (`/health`) created with all components
- [ ] Alerts System page (`/alerts`) created with all components
- [ ] Real-time health monitoring with auto-refresh
- [ ] Alert rules management interface
- [ ] Alert notification channels configuration
- [ ] Alert history and audit trail
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Full accessibility support (WCAG 2.1 AA)
- [ ] 42 E2E tests passing

## Dependencies

- TODO-018: Test fixtures for alert data
- Backend health API endpoints
- Backend alerts API endpoints
- Real-time data streaming (WebSocket or polling)

## Subtasks

### 1. Health Dashboard - Core Components (Est: 1 day)

**Files to create**:
- `apps/frontend/src/pages/observability/HealthPage.tsx`
- `apps/frontend/src/features/health/components/HealthDashboard.tsx`
- `apps/frontend/src/features/health/components/HealthOverview.tsx`
- `apps/frontend/src/features/health/components/ServiceStatusCard.tsx`

**Components to implement**:
1. **HealthDashboard**:
   - Overall system status indicator (healthy/degraded/unhealthy)
   - Service status cards (API, Database, Redis, etc.)
   - Real-time metrics display
   - Auto-refresh toggle

2. **ServiceStatusCard**:
   - Service name and icon
   - Status indicator (green/yellow/red)
   - Uptime percentage
   - Response time metrics
   - Error rate

**API Integration**:
```typescript
// apps/frontend/src/api/health.ts
export const healthAPI = {
  getSystemHealth: () => api.get<SystemHealth>('/health'),
  getServiceStatus: (serviceId: string) =>
    api.get<ServiceStatus>(`/health/services/${serviceId}`),
  getHealthMetrics: (timeRange: string) =>
    api.get<HealthMetrics>(`/health/metrics?range=${timeRange}`),
};
```

**Verification**:
```bash
npm run test:e2e -- e2e/health.spec.ts -g "Health Dashboard"
```

**Success Criteria**:
- [ ] Health dashboard displays system status
- [ ] Service cards show all services
- [ ] Status indicators color-coded correctly
- [ ] Auto-refresh works
- [ ] 10 tests passing

### 2. Health Dashboard - Service Monitoring (Est: 1 day)

**Files to create**:
- `apps/frontend/src/features/health/components/ServiceStatusList.tsx`
- `apps/frontend/src/features/health/components/StatusIndicator.tsx`
- `apps/frontend/src/features/health/components/UptimeChart.tsx`

**Components to implement**:
1. **ServiceStatusList**:
   - List of all monitored services
   - Filter by status (all, healthy, degraded, unhealthy)
   - Sort by name, status, uptime
   - Search functionality

2. **StatusIndicator**:
   - Visual status indicator (dot, badge, icon)
   - Accessible text labels
   - Tooltip with details
   - Animation for state changes

3. **UptimeChart**:
   - 24-hour uptime visualization
   - Incident markers
   - Hover details
   - Time axis

**State Management**:
```typescript
// apps/frontend/src/store/health.ts
interface HealthState {
  systemHealth: SystemHealth | null;
  services: ServiceStatus[];
  metrics: HealthMetrics | null;
  autoRefresh: boolean;
  refreshInterval: number;
  isLoading: boolean;
}
```

**Verification**:
```bash
npm run test:e2e -- e2e/health.spec.ts -g "Service Status"
```

**Success Criteria**:
- [ ] Service list displays all services
- [ ] Status filters work correctly
- [ ] Uptime percentage displayed
- [ ] Status indicators accessible
- [ ] 8 tests passing

### 3. Health Dashboard - Metrics and Incidents (Est: 1 day)

**Files to create**:
- `apps/frontend/src/features/health/components/HealthMetrics.tsx`
- `apps/frontend/src/features/health/components/IncidentTimeline.tsx`
- `apps/frontend/src/features/health/components/DependencyStatus.tsx`

**Components to implement**:
1. **HealthMetrics**:
   - Response time metrics (avg, p50, p95, p99)
   - Error rate percentage
   - Request count
   - CPU and memory usage

2. **IncidentTimeline**:
   - List of past incidents
   - Incident severity and duration
   - Resolution time
   - Root cause summary

3. **DependencyStatus**:
   - External service dependencies
   - Dependency health checks
   - Impact on system

**Verification**:
```bash
npm run test:e2e -- e2e/health.spec.ts -g "Metrics|Incident History|Dependency"
```

**Success Criteria**:
- [ ] Metrics display correctly
- [ ] Incident timeline shows past incidents
- [ ] Dependencies visible
- [ ] 9 tests passing

### 4. Health Dashboard - Real-time Updates and Export (Est: 0.5 day)

**Files to create**:
- `apps/frontend/src/features/health/hooks/useHealthStream.ts`
- `apps/frontend/src/features/health/components/HealthExport.tsx`

**Features to implement**:
1. **Real-time Updates**:
   - WebSocket connection for live updates
   - Auto-refresh with configurable interval
   - Last updated timestamp
   - Live indicator

2. **Export**:
   - Export health report (PDF, CSV, JSON)
   - Date range selection
   - Include/exclude sections

**Verification**:
```bash
npm run test:e2e -- e2e/health.spec.ts -g "Real-time|Export|Status Page"
```

**Success Criteria**:
- [ ] Real-time updates work
- [ ] Auto-refresh toggle functional
- [ ] Export options available
- [ ] 6 tests passing

### 5. Alerts System - Core Components (Est: 1 day)

**Files to create**:
- `apps/frontend/src/pages/observability/AlertsPage.tsx`
- `apps/frontend/src/features/alerts/components/AlertsList.tsx`
- `apps/frontend/src/features/alerts/components/AlertCard.tsx`
- `apps/frontend/src/features/alerts/components/AlertRulesList.tsx`

**Components to implement**:
1. **AlertsList**:
   - List of active alerts
   - Filter by severity (critical, warning, info)
   - Filter by status (active, acknowledged, resolved)
   - Search functionality

2. **AlertCard**:
   - Alert message and severity
   - Timestamp
   - Actions (acknowledge, resolve, silence)
   - Status indicator

3. **AlertRulesList**:
   - List of alert rules
   - Rule name and condition
   - Actions on trigger
   - Enable/disable toggle

**API Integration**:
```typescript
// apps/frontend/src/api/alerts.ts
export const alertsAPI = {
  getAlerts: (filters: AlertFilters) =>
    api.get<Alert[]>('/alerts', { params: filters }),
  acknowledgeAlert: (id: string) =>
    api.post(`/alerts/${id}/acknowledge`),
  resolveAlert: (id: string) =>
    api.post(`/alerts/${id}/resolve`),
  silenceAlert: (id: string, duration: number) =>
    api.post(`/alerts/${id}/silence`, { duration }),
  getRules: () => api.get<AlertRule[]>('/alerts/rules'),
  createRule: (rule: CreateAlertRule) =>
    api.post('/alerts/rules', rule),
};
```

**Verification**:
```bash
npm run test:e2e -- e2e/alerts.spec.ts -g "Alerts List Page|Severity Levels|Alert Rules"
```

**Success Criteria**:
- [ ] Alerts list displays alerts
- [ ] Severity levels color-coded
- [ ] Alert rules page shows rules
- [ ] 4 tests passing

### 6. Alerts System - Rule Management (Est: 0.5 day)

**Files to create**:
- `apps/frontend/src/features/alerts/components/CreateAlertRuleDialog.tsx`
- `apps/frontend/src/features/alerts/components/AlertRuleForm.tsx`
- `apps/frontend/src/features/alerts/components/MetricSelector.tsx`
- `apps/frontend/src/features/alerts/components/ThresholdConfig.tsx`

**Components to implement**:
1. **CreateAlertRuleDialog**:
   - Dialog for creating alert rules
   - Multi-step form
   - Validation

2. **AlertRuleForm**:
   - Rule name and description
   - Metric selection
   - Threshold configuration
   - Notification channel selection

3. **MetricSelector**:
   - Dropdown of available metrics
   - Metric preview
   - Custom metrics

4. **ThresholdConfig**:
   - Threshold value input
   - Comparison operator (>, <, =, !=)
   - Duration window

**Verification**:
```bash
npm run test:e2e -- e2e/alerts.spec.ts -g "Create Alert Rule"
```

**Success Criteria**:
- [ ] Create rule dialog opens
- [ ] Metric selection works
- [ ] Threshold configuration functional
- [ ] Notification channels selectable
- [ ] 4 tests passing

### 7. Alerts System - Actions and Notifications (Est: 0.5 day)

**Files to create**:
- `apps/frontend/src/features/alerts/components/AlertActions.tsx`
- `apps/frontend/src/features/alerts/components/NotificationChannels.tsx`
- `apps/frontend/src/features/alerts/components/AlertHistory.tsx`

**Components to implement**:
1. **AlertActions**:
   - Acknowledge button
   - Resolve button
   - Silence dropdown (1h, 4h, 24h, custom)
   - Bulk actions

2. **NotificationChannels**:
   - Email configuration
   - Slack integration
   - Webhook notifications
   - PagerDuty integration

3. **AlertHistory**:
   - Historical alerts
   - Date range filter
   - Export functionality

**Verification**:
```bash
npm run test:e2e -- e2e/alerts.spec.ts -g "Alert Actions|Notification Channels|History"
```

**Success Criteria**:
- [ ] Alert actions functional
- [ ] Notification channels configurable
- [ ] Alert history displays
- [ ] 3 tests passing

### 8. Responsive Design and Accessibility (Est: 0.5 day)

**Files to modify**:
- All health and alerts components

**Requirements**:
1. **Responsive Design**:
   - Mobile: Stack cards vertically
   - Tablet: 2-column grid
   - Desktop: 3-column grid with sidebar

2. **Accessibility**:
   - Proper heading hierarchy (h1, h2, h3)
   - Keyboard navigation
   - Screen reader announcements for status changes
   - ARIA live regions for alerts
   - Focus management in dialogs

**Verification**:
```bash
npm run test:e2e -- e2e/health.spec.ts -g "Responsive|Accessibility"
npm run test:e2e -- e2e/alerts.spec.ts -g "Responsive|Accessibility"
```

**Success Criteria**:
- [ ] Mobile layout working
- [ ] Keyboard navigation functional
- [ ] Screen reader compatible
- [ ] 8 tests passing

## Testing Requirements

### Unit Tests
- [ ] Health components render correctly
- [ ] Alerts components render correctly
- [ ] Status indicators display proper colors
- [ ] Filters work correctly
- [ ] Actions trigger correct API calls

### Integration Tests
- [ ] Health API integration working
- [ ] Alerts API integration working
- [ ] Real-time updates functional
- [ ] WebSocket connection stable

### E2E Tests
- [ ] 33 health dashboard tests passing
- [ ] 9 alerts system tests passing
- [ ] Total: 42 tests passing
- [ ] No regressions in other tests

## Risk Assessment

**HIGH**:
- Real-time data streaming reliability
- Performance with large alert volumes

**MEDIUM**:
- API response time affecting UX
- Notification channel integration complexity

**LOW**:
- Color contrast in status indicators
- Export functionality edge cases

## Mitigation Strategies

1. **Real-time Updates**:
   - Fallback to polling if WebSocket fails
   - Configurable refresh interval
   - Connection retry logic

2. **Performance**:
   - Pagination for alert lists
   - Virtual scrolling for large lists
   - Debounce search and filters

3. **Reliability**:
   - Error boundaries for components
   - Loading states for all API calls
   - Offline detection and recovery

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Health Dashboard page fully functional
- [ ] Alerts System page fully functional
- [ ] Real-time monitoring working
- [ ] Alert rule management complete
- [ ] Notification channels configured
- [ ] Responsive design implemented
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] 42 E2E tests passing
- [ ] Unit tests passing
- [ ] Documentation updated
- [ ] Code review completed
- [ ] No policy violations

## Related Files

**To Create**:
- `apps/frontend/src/pages/observability/HealthPage.tsx`
- `apps/frontend/src/pages/observability/AlertsPage.tsx`
- `apps/frontend/src/features/health/` (12 components)
- `apps/frontend/src/features/alerts/` (11 components)
- `apps/frontend/src/api/health.ts`
- `apps/frontend/src/api/alerts.ts`
- `apps/frontend/src/store/health.ts`
- `apps/frontend/src/store/alerts.ts`

**Existing Tests**:
- `apps/frontend/e2e/health.spec.ts` (33 tests)
- `apps/frontend/e2e/alerts.spec.ts` (9 tests)

## Progress Tracking

- [ ] Task breakdown complete
- [ ] Health Dashboard core components
- [ ] Health Dashboard service monitoring
- [ ] Health Dashboard metrics and incidents
- [ ] Health Dashboard real-time and export
- [ ] Alerts System core components
- [ ] Alerts System rule management
- [ ] Alerts System actions and notifications
- [ ] Responsive design and accessibility
- [ ] 42 E2E tests passing
- [ ] Documentation complete
- [ ] Code review approved
