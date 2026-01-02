# ESA Configuration Components - Quick Reference

## Import Components

```typescript
import {
  ESAConfigPanel,
  ESAStatusIndicator
} from "@/features/trust/components/ESAConfig";

import {
  useESAConfig,
  useUpdateESAConfig,
  useTestESAConnection
} from "@/features/trust/hooks";
```

## ESAConfigPanel

### Basic Usage
```typescript
<ESAConfigPanel
  onSuccess={() => {
    console.log("Configuration saved!");
  }}
/>
```

### Props
```typescript
interface ESAConfigPanelProps {
  onSuccess?: () => void;
}
```

### Features
- ✅ ESA agent selection from discovered agents
- ✅ Enforcement mode: AUDIT_ONLY or ENFORCE
- ✅ Authority binding via AuthoritySelector
- ✅ Default capabilities editor (template gallery + custom)
- ✅ System constraints editor (templates + custom)
- ✅ Test connection button
- ✅ Save/Reset with change tracking
- ✅ Form validation with Zod

## ESAStatusIndicator

### Full Display
```typescript
<ESAStatusIndicator
  isActive={true}
  enforcementMode={EnforcementMode.ENFORCE}
  healthStatus={ESAHealthStatus.HEALTHY}
  lastHealthCheck="2025-12-16T12:00:00Z"
/>
```

### Compact Display
```typescript
<ESAStatusIndicator
  isActive={true}
  enforcementMode={EnforcementMode.AUDIT_ONLY}
  healthStatus={ESAHealthStatus.DEGRADED}
  lastHealthCheck="2025-12-16T12:00:00Z"
  compact
/>
```

### Props
```typescript
interface ESAStatusIndicatorProps {
  isActive: boolean;
  enforcementMode: EnforcementMode;
  healthStatus: ESAHealthStatus;
  lastHealthCheck: string | null;
  className?: string;
  compact?: boolean;
}
```

## React Query Hooks

### Fetch ESA Config
```typescript
const { data, isPending, error } = useESAConfig();

// data: ESAConfig | undefined
// isPending: boolean
// error: Error | null
```

### Update ESA Config
```typescript
const { mutate, isPending } = useUpdateESAConfig();

mutate(
  {
    agent_id: "esa-001",
    enforcement_mode: EnforcementMode.ENFORCE,
    is_active: true,
  },
  {
    onSuccess: (data) => {
      console.log("Updated:", data);
    },
    onError: (error) => {
      console.error("Failed:", error);
    },
  }
);
```

### Test Connection
```typescript
const { mutate, isPending } = useTestESAConnection();

mutate(undefined, {
  onSuccess: (result) => {
    console.log(result.success ? "Success" : "Failed");
    console.log(result.message);
  },
});
```

## Types

### ESAConfig
```typescript
interface ESAConfig {
  id: string;
  agent_id: string;
  enforcement_mode: EnforcementMode;
  authority_id: string;
  default_capabilities: string[];
  system_constraints: string[];
  is_active: boolean;
  health_status: ESAHealthStatus;
  last_check_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### EnforcementMode
```typescript
enum EnforcementMode {
  AUDIT_ONLY = "audit_only",
  ENFORCE = "enforce",
}
```

### ESAHealthStatus
```typescript
enum ESAHealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  OFFLINE = "offline",
}
```

## Common Patterns

### Dashboard Widget
```typescript
function ESADashboardWidget() {
  const { data: esaConfig } = useESAConfig();

  if (!esaConfig) {
    return <div>No ESA configured</div>;
  }

  return (
    <ESAStatusIndicator
      isActive={esaConfig.is_active}
      enforcementMode={esaConfig.enforcement_mode}
      healthStatus={esaConfig.health_status}
      lastHealthCheck={esaConfig.last_check_at}
    />
  );
}
```

### Settings Page
```typescript
function SettingsPage() {
  return (
    <div className="container py-8">
      <h1>ESA Configuration</h1>
      <ESAConfigPanel onSuccess={() => toast("Saved!")} />
    </div>
  );
}
```

### Header Status
```typescript
function HeaderESAStatus() {
  const { data: esaConfig } = useESAConfig();

  if (!esaConfig) return null;

  return (
    <ESAStatusIndicator
      isActive={esaConfig.is_active}
      enforcementMode={esaConfig.enforcement_mode}
      healthStatus={esaConfig.health_status}
      lastHealthCheck={esaConfig.last_check_at}
      compact
      className="ml-auto"
    />
  );
}
```

## API Field Names

**IMPORTANT**: The API uses snake_case field names:
- `agent_id` (not `agentId`)
- `enforcement_mode` (not `enforcementMode`)
- `authority_id` (not `authorityId`)
- `default_capabilities` (not `defaultCapabilities`)
- `system_constraints` (not `systemConstraints`)
- `is_active` (not `isActive`)
- `health_status` (not `healthStatus`)
- `last_check_at` (not `lastCheckAt`)

The components handle the conversion automatically.

## Color Coding

### Health Status
- 🟢 **HEALTHY**: Green (text-green-500, bg-green-500/10)
- 🟡 **DEGRADED**: Yellow (text-yellow-500, bg-yellow-500/10)
- 🔴 **OFFLINE**: Red (text-red-500, bg-red-500/10)

### Enforcement Mode
- 🔵 **AUDIT_ONLY**: Blue (text-blue-600, bg-blue-500/10)
- 🟣 **ENFORCE**: Purple (text-purple-600, bg-purple-500/10)

## Responsive Breakpoints

The components are responsive:
- **Mobile**: Single column layout
- **Tablet**: 2-column capability templates
- **Desktop**: Full width with optimized spacing
