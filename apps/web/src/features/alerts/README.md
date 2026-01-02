# Alerts Management Feature

A comprehensive alerts management feature for Kaizen Studio, built with React 19, TypeScript, shadcn/ui, and @tanstack/react-query.

## 📁 Feature Structure

```
alerts/
├── types/
│   ├── alert.ts          # TypeScript interfaces and types
│   └── index.ts          # Type exports
├── api/
│   ├── alerts.ts         # API client with mocked responses
│   └── index.ts          # API exports
├── hooks/
│   ├── useAlerts.ts      # React Query hooks
│   └── index.ts          # Hook exports
├── components/
│   ├── AlertCard.tsx     # Individual alert card
│   ├── AlertList.tsx     # List with filtering
│   ├── AlertDialog.tsx   # Create/edit dialog
│   ├── AlertForm.tsx     # Form with validation
│   ├── AlertRuleBuilder.tsx  # Visual rule builder
│   ├── AlertHistory.tsx  # History timeline
│   ├── __tests__/        # Component tests
│   │   ├── AlertCard.test.tsx
│   │   ├── AlertList.test.tsx
│   │   ├── AlertDialog.test.tsx
│   │   └── AlertHistory.test.tsx
│   └── index.ts          # Component exports
├── index.ts              # Barrel export
└── README.md             # This file
```

## 🎯 Components

### 1. AlertList

**Purpose**: Main list view with filtering and pagination

**Features**:

- Search by alert name/description
- Filter by severity (critical/warning/info)
- Filter by status (active/acknowledged/resolved)
- Filter by metric (CPU, memory, disk, etc.)
- Responsive grid layout (1/2/3 columns)
- Pagination support
- Empty state with CTA
- Loading skeletons

**Usage**:

```tsx
import { AlertList } from "@/features/alerts";

<AlertList
  onCreateRule={() => setCreateDialogOpen(true)}
  onViewHistory={(alertId) => navigate(`/alerts/${alertId}/history`)}
/>;
```

### 2. AlertCard

**Purpose**: Display individual alert with actions

**Features**:

- Severity badge (critical/warning/info)
- Status badge (active/acknowledged/resolved)
- Condition display
- Current value vs threshold
- Timestamp formatting (relative)
- Action dropdown menu
  - Acknowledge (active alerts)
  - Resolve (non-resolved)
  - View History

**Usage**:

```tsx
import { AlertCard } from "@/features/alerts";

<AlertCard
  alert={alert}
  onAcknowledge={handleAcknowledge}
  onResolve={handleResolve}
  onViewHistory={handleViewHistory}
/>;
```

### 3. AlertDialog

**Purpose**: Create/edit alert rules

**Features**:

- Create mode (no rule prop)
- Edit mode (with rule prop)
- Form validation
- Success/error toasts
- Loading states
- Auto-close on success

**Usage**:

```tsx
import { AlertDialog } from '@/features/alerts';

// Create mode
<AlertDialog
  open={isCreateOpen}
  onOpenChange={setIsCreateOpen}
/>

// Edit mode
<AlertDialog
  open={isEditOpen}
  onOpenChange={setIsEditOpen}
  rule={selectedRule}
/>
```

### 4. AlertForm

**Purpose**: Alert rule configuration form

**Features**:

- Name + description fields
- Visual rule builder integration
- Form validation (react-hook-form)
- Enable/disable toggle
- Submit/cancel actions
- Disabled state support

**Validation**:

- Name: required, 3-100 chars
- Description: optional, max 500 chars
- Metric, operator, threshold, duration: required
- Severity: required

### 5. AlertRuleBuilder

**Purpose**: Visual rule condition builder

**Features**:

- Condition preview
- Metric selection (7 metrics)
- Operator selection (6 operators with icons)
- Threshold input
- Duration input (seconds)
- Severity selection (3 levels)
- Rule summary visualization

**Supported Metrics**:

- CPU Usage
- Memory Usage
- Disk Usage
- Response Time
- Error Rate
- Request Count
- Active Users

**Operators**:

- Greater Than (>)
- Less Than (<)
- Equal To (=)
- Greater Than or Equal (≥)
- Less Than or Equal (≤)
- Not Equal To (≠)

### 6. AlertHistory

**Purpose**: Alert event timeline

**Features**:

- Chronological event list
- Event cards with details
- Severity badges
- Resolved/active status
- Duration calculation
- Relative timestamps
- Empty state
- Loading skeletons

## 🔌 API Layer (Mocked)

All API calls are mocked with realistic delays (200-300ms) and data. The mock implementation simulates:

- 25 pre-generated alerts
- 8 pre-generated alert rules
- Dynamic history generation
- CRUD operations with in-memory storage
- Pagination support
- Filter application

## 🪝 React Query Hooks

### Alert Hooks

- `useAlerts(filters)` - Get all alerts with filters
- `useAlert(id)` - Get single alert
- `useAcknowledgeAlert()` - Acknowledge alert
- `useResolveAlert()` - Resolve alert
- `useAlertHistory(alertId)` - Get alert history

### Alert Rule Hooks

- `useAlertRules(filters)` - Get all alert rules
- `useAlertRule(id)` - Get single alert rule
- `useCreateAlertRule()` - Create new rule
- `useUpdateAlertRule()` - Update existing rule
- `useDeleteAlertRule()` - Delete rule
- `useToggleAlertRule()` - Toggle enabled state

### Query Keys

- `alertKeys` - Query key factory for alerts
- `alertRuleKeys` - Query key factory for alert rules

## 📊 Type System

### Core Types

```typescript
// Alert severity levels
type AlertSeverity = "critical" | "warning" | "info";

// Alert statuses
type AlertStatus = "active" | "resolved" | "acknowledged";

// Comparison operators
type AlertOperator = "gt" | "lt" | "eq" | "gte" | "lte" | "ne";

// Monitored metrics
type AlertMetric =
  | "cpu_usage"
  | "memory_usage"
  | "disk_usage"
  | "response_time"
  | "error_rate"
  | "request_count"
  | "active_users";
```

### Main Interfaces

- `Alert` - Active/historical alert
- `AlertRule` - Alert rule configuration
- `AlertHistory` - Alert event history
- `CreateAlertRuleInput` - Create payload
- `UpdateAlertRuleInput` - Update payload
- `AlertFilters` - List filters
- `AlertRuleFilters` - Rule list filters

## 🧪 Testing

All components have comprehensive vitest tests with:

- Loading state tests
- Empty state tests
- Data rendering tests
- Filter tests
- Pagination tests
- Error state tests
- User interaction tests
- Form validation tests

**Run tests**:

```bash
npm run test
```

## 🎨 UI/UX Features

### Responsive Design

- Mobile: 1 column grid
- Tablet: 2 column grid
- Desktop: 3 column grid
- Fluid layout with proper spacing

### Loading States

- Skeleton loaders for all components
- Consistent animation timing
- Proper accessibility attributes

### Error Handling

- Graceful error states
- User-friendly error messages
- Toast notifications for actions
- Retry mechanisms

### Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management

## 📝 Usage Example

```tsx
import { useState } from "react";
import { AlertList, AlertDialog, AlertHistory } from "@/features/alerts";

function AlertsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alerts</h1>
      </div>

      <AlertList
        onCreateRule={() => setIsCreateDialogOpen(true)}
        onViewHistory={(alertId) => setSelectedAlertId(alertId)}
      />

      <AlertDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {selectedAlertId && (
        <div className="mt-8">
          <AlertHistory alertId={selectedAlertId} />
        </div>
      )}
    </div>
  );
}
```

## 🚀 Integration

### 1. Import the feature

```typescript
import {
  AlertList,
  AlertDialog,
  AlertHistory,
  useAlerts,
  useCreateAlertRule,
  type Alert,
  type AlertRule,
} from "@/features/alerts";
```

### 2. Add to router

```tsx
import { AlertsPage } from '@/pages/alerts';

// In your router config
{
  path: '/alerts',
  element: <AlertsPage />,
}
```

### 3. Backend Integration (When Ready)

Replace the mocked API in `api/alerts.ts` with real API calls:

```typescript
// Change from:
const mockResponse = generateMockAlerts();
return mockResponse;

// To:
const response = await apiClient.get("/api/alerts", { params: filters });
return response.data;
```

## 📦 Dependencies

- React 19
- TypeScript
- @tanstack/react-query (state management)
- react-hook-form (form handling)
- shadcn/ui (UI components)
- lucide-react (icons)
- date-fns (date formatting)
- vitest (testing)
- @testing-library/react (component testing)

## 🎯 Best Practices Followed

1. ✅ **Component Modularity**: Single responsibility components
2. ✅ **Type Safety**: Comprehensive TypeScript types
3. ✅ **State Management**: React Query for server state
4. ✅ **Loading States**: Skeleton loaders everywhere
5. ✅ **Error Handling**: Graceful error states
6. ✅ **Responsive Design**: Mobile-first approach
7. ✅ **Accessibility**: ARIA labels and semantic HTML
8. ✅ **Testing**: Comprehensive test coverage
9. ✅ **Code Reusability**: Shared components and utilities
10. ✅ **Documentation**: Inline comments and README

## 🔮 Future Enhancements

- [ ] Real-time alert updates via WebSockets
- [ ] Alert notification system (push/email)
- [ ] Advanced filtering (date ranges, multiple metrics)
- [ ] Alert rule templates
- [ ] Bulk actions (acknowledge/resolve multiple)
- [ ] Export alerts to CSV/JSON
- [ ] Alert analytics dashboard
- [ ] Integration with monitoring systems
- [ ] Custom webhook notifications
- [ ] Alert rule testing/simulation

---

**Built with ❤️ for Kaizen Studio**
