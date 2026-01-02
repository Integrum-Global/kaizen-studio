# ESA Configuration Components

Phase 4 of the EATP (Enterprise Agent Trust Protocol) frontend implementation.

## Overview

The ESA Configuration components provide a complete UI for configuring and monitoring the Enterprise Security Authority agent, which is responsible for managing trust operations across the system.

## Components

### ESAConfigPanel

Main configuration panel for the ESA agent.

**Features:**

- ESA agent selection from discovered agents
- Authority binding configuration
- Enforcement mode toggle (AUDIT_ONLY vs ENFORCE)
- Active/Inactive status control
- Default capabilities editor (reuses CapabilityEditor)
- System-wide constraints editor (reuses ConstraintEditor)
- Form validation with Zod
- Loading and error states
- Toast notifications for success/failure
- Reset functionality
- Connection testing

**Props:**

```typescript
interface ESAConfigPanelProps {
  onSuccess?: () => void;
}
```

**Usage:**

```tsx
import { ESAConfigPanel } from "@/features/trust";

function SettingsPage() {
  return <ESAConfigPanel onSuccess={() => console.log("Config saved")} />;
}
```

### ESAStatusIndicator

Displays the current status of the ESA agent.

**Features:**

- Active/Inactive status badge
- Enforcement mode display (AUDIT_ONLY or ENFORCE)
- Health status indicator (HEALTHY, DEGRADED, UNHEALTHY, UNKNOWN)
- Last check timestamp with relative time
- Compact mode for headers/toolbars
- Full mode with detailed status cards
- Warning display for inactive ESA

**Props:**

```typescript
interface ESAStatusIndicatorProps {
  isActive: boolean;
  enforcementMode: EnforcementMode;
  healthStatus: HealthStatus;
  lastHealthCheck: string | null;
  className?: string;
  compact?: boolean;
}
```

**Usage:**

```tsx
import { ESAStatusIndicator } from "@/features/trust";
import { useESAConfig } from "@/features/trust";

function Dashboard() {
  const { data: config } = useESAConfig();

  if (!config) return null;

  return (
    <ESAStatusIndicator
      isActive={config.isActive}
      enforcementMode={config.enforcementMode}
      healthStatus={config.healthStatus}
      lastHealthCheck={config.lastHealthCheck}
    />
  );
}

// Compact mode for headers
function Header() {
  const { data: config } = useESAConfig();

  return <ESAStatusIndicator {...config} compact className="justify-end" />;
}
```

## Types

### ESAConfig

```typescript
interface ESAConfig {
  id: string;
  agentId: string;
  enforcementMode: EnforcementMode;
  authorityId: string;
  defaultCapabilities: CapabilityAttestation[];
  systemConstraints: string[];
  isActive: boolean;
  lastHealthCheck: string | null;
  healthStatus: HealthStatus;
  createdAt: string;
  updatedAt: string;
}
```

### EnforcementMode

```typescript
enum EnforcementMode {
  AUDIT_ONLY = "audit_only",
  ENFORCE = "enforce",
}
```

### HealthStatus

```typescript
enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
  UNKNOWN = "unknown",
}
```

### ESAConnectionTestResult

```typescript
interface ESAConnectionTestResult {
  success: boolean;
  latency: number;
  error?: string;
}
```

### ESAConfigFormData

```typescript
interface ESAConfigFormData {
  agentId: string;
  authorityId: string;
  enforcementMode: EnforcementMode;
  isActive: boolean;
  defaultCapabilities: CapabilityFormData[];
  systemConstraints: string[];
}
```

## API Functions

### getESAConfig

```typescript
async function getESAConfig(): Promise<ESAConfig | null>;
```

Retrieves the current ESA configuration. Returns null if no configuration exists.

### updateESAConfig

```typescript
async function updateESAConfig(config: Partial<ESAConfig>): Promise<ESAConfig>;
```

Updates the ESA configuration with the provided values.

### testESAConnection

```typescript
async function testESAConnection(): Promise<ESAConnectionTestResult>;
```

Tests the connection to the ESA agent and returns latency information.

## Hooks

### useESAConfig

```typescript
function useESAConfig(): UseQueryResult<ESAConfig | null>;
```

React Query hook to fetch the ESA configuration.

### useUpdateESAConfig

```typescript
function useUpdateESAConfig(): UseMutationResult<
  ESAConfig,
  Error,
  Partial<ESAConfig>
>;
```

React Query mutation hook to update the ESA configuration.

### useTestESAConnection

```typescript
function useTestESAConnection(): UseMutationResult<
  ESAConnectionTestResult,
  Error,
  void
>;
```

React Query mutation hook to test the ESA connection.

## File Structure

```
ESAConfig/
├── index.ts                    # Barrel exports
├── ESAConfigPanel.tsx          # Main configuration panel
├── ESAStatusIndicator.tsx      # Status indicator component
├── schema.ts                   # Zod validation schema
├── USAGE_EXAMPLE.tsx           # Usage examples
└── README.md                   # This file
```

## Integration with Existing Components

The ESA Configuration components reuse existing trust management components:

- **CapabilityEditor**: For managing default capabilities
- **ConstraintEditor**: For managing system-wide constraints
- **AuthoritySelector**: For selecting the binding authority

This ensures consistency across the trust feature and reduces code duplication.

## Validation

Form validation is handled using Zod with the following rules:

- **agentId**: Required, non-empty string
- **authorityId**: Required, non-empty string
- **enforcementMode**: Must be a valid EnforcementMode enum value
- **isActive**: Boolean value
- **defaultCapabilities**: Array of valid capability objects
- **systemConstraints**: Array of constraint strings

## Responsive Design

All components are fully responsive:

- **Desktop**: Two-column layout for enforcement mode and status
- **Mobile**: Single-column stacked layout
- **Compact Mode**: Optimized for headers and toolbars

## Toast Notifications

The components use the Shadcn toast system for user feedback:

- **Success**: Configuration saved successfully
- **Error**: Save failures with error details
- **Connection Test**: Success/failure with latency info

## Error Handling

- Loading states with spinners
- Error messages for failed operations
- Graceful handling of missing configuration
- Validation errors displayed inline

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus management
- Color contrast compliance

## Dark Mode Support

All components support dark mode through Tailwind CSS dark mode utilities.

## Examples

See `USAGE_EXAMPLE.tsx` for comprehensive usage examples including:

1. Full ESA Configuration Page
2. Dashboard Widget with Status
3. Compact Status in Header
4. Inline Status Display
5. Settings Page with Tabs
6. Modal Configuration
7. Status with Alert

## API Endpoints

The components expect the following API endpoints to be available:

- `GET /api/v1/trust/esa/config` - Get ESA configuration
- `PUT /api/v1/trust/esa/config` - Update ESA configuration
- `POST /api/v1/trust/esa/test-connection` - Test ESA connection
- `GET /api/v1/trust/registry/discover` - Discover agents
- `GET /api/v1/trust/authorities` - List authorities

## Dependencies

- React 18+
- @tanstack/react-query
- react-hook-form
- zod
- @hookform/resolvers/zod
- Shadcn/ui components
- Tailwind CSS
- lucide-react icons

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
