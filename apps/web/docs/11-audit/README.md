# Audit Logs

The Audit feature provides comprehensive activity logging and compliance tracking for Kaizen Studio.

## Overview

Audit Logs track all significant actions in the system for security, compliance, and debugging purposes. Features include:

- Comprehensive action logging
- Advanced filtering and search
- Date range queries
- Export functionality
- Expandable log details

## Feature Structure

```
src/features/audit/
├── api.ts                    # API layer with auditApi
├── hooks.ts                  # React Query hooks
├── types.ts                  # TypeScript interfaces
├── index.ts                  # Barrel export
└── components/
    ├── AuditLogList.tsx      # Main list view
    ├── AuditLogRow.tsx       # Expandable table row
    ├── AuditFilters.tsx      # Filter controls
    ├── AuditExportDialog.tsx # Export dialog
    └── __tests__/            # Component tests
```

## Types

```typescript
interface AuditLog {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  resource: string;
  resourceId: string;
  resourceName?: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface AuditActor {
  id: string;
  name: string;
  email: string;
}

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'access'
  | 'export'
  | 'deploy'
  | 'execute';

interface AuditFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  action?: AuditAction;
  status?: 'success' | 'failure';
  resource?: string;
  actor?: string;
  startDate?: string;
  endDate?: string;
}
```

## API Layer

```typescript
import { auditApi } from '@/features/audit';

// Get logs with filters
const logs = await auditApi.getLogs({
  page: 1,
  pageSize: 20,
  action: 'create',
  startDate: '2024-01-01',
});

// Export logs
const blob = await auditApi.export({
  format: 'csv',  // or 'json'
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

## Hooks

```typescript
import { useAuditLogs, useExportAuditLogs } from '@/features/audit';

// Fetch logs with automatic refetching
const { data, isPending, error } = useAuditLogs({
  action: 'deploy',
  status: 'success',
});

// Export mutation
const exportLogs = useExportAuditLogs();
await exportLogs.mutateAsync({
  format: 'csv',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```

## Components

### AuditLogList

Main view displaying audit logs in a table with expandable rows.

```tsx
import { AuditLogList } from '@/features/audit';

function AuditPage() {
  return <AuditLogList />;
}
```

### AuditFilters

Filter controls for searching and filtering logs.

```tsx
import { AuditFilters } from '@/features/audit';

<AuditFilters
  filters={currentFilters}
  onSearch={handleSearch}
  onFilterChange={handleFilterChange}
  onDateRangeChange={handleDateRangeChange}
/>
```

### AuditLogRow

Expandable table row showing log summary and details.

```tsx
import { AuditLogRow } from '@/features/audit';

// Used within AuditLogList table
<AuditLogRow log={auditLog} />

// Expanded state shows:
// - Log ID
// - IP Address
// - User Agent
// - Full JSON details
```

### AuditExportDialog

Modal for exporting logs with format and date range selection.

```tsx
import { AuditExportDialog } from '@/features/audit';

<AuditExportDialog
  open={isExportOpen}
  onOpenChange={setIsExportOpen}
/>
```

## Filter Options

### Actions
- `create` - Resource creation
- `update` - Resource modification
- `delete` - Resource deletion
- `login` - User authentication
- `logout` - Session termination
- `access` - Resource access
- `export` - Data export
- `deploy` - Deployment actions
- `execute` - Execution events

### Status
- `success` - Successful operations
- `failure` - Failed operations

### Date Range
- Start date picker
- End date picker
- Clear dates button

## Export Formats

### CSV
Standard CSV format compatible with spreadsheets:
```csv
id,action,actor_name,actor_email,resource,status,timestamp
log-123,create,John Doe,john@example.com,agent,success,2024-01-15T10:30:00Z
```

### JSON
Full JSON export with nested details:
```json
{
  "logs": [
    {
      "id": "log-123",
      "action": "create",
      "actor": { "id": "user-1", "name": "John Doe", "email": "john@example.com" },
      "resource": "agent",
      "status": "success",
      "details": { "changes": [...] },
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "exportedAt": "2024-01-16T09:00:00Z"
}
```

## Testing

The feature includes 11 tests covering:

- Loading and error states
- Log rendering
- Filter functionality
- Pagination
- Row expansion
- Export functionality

Run tests:

```bash
npm run test -- audit
```

## Related Features

- [Authentication](../04-authentication/README.md) - Login/logout tracking
- [Teams](../09-teams/README.md) - Team activity logs
- [API Keys](../10-api-keys/README.md) - Key usage logs
