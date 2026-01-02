# ESA Configuration - Quick Start Guide

## Installation

The ESA Configuration components are part of the trust feature. No additional installation needed.

## Basic Usage

### 1. Import Components

```typescript
import { ESAConfigPanel, ESAStatusIndicator } from "@/features/trust";
```

### 2. Add ESA Configuration Page

```tsx
// src/pages/settings/ESAConfig.tsx
import { ESAConfigPanel } from "@/features/trust";

export default function ESAConfigPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">ESA Configuration</h1>
      <ESAConfigPanel />
    </div>
  );
}
```

### 3. Add Status Indicator to Dashboard

```tsx
// src/pages/Dashboard.tsx
import { ESAStatusIndicator } from "@/features/trust";
import { useESAConfig } from "@/features/trust";

export default function Dashboard() {
  const { data: config } = useESAConfig();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Trust Overview</h2>
      {config && (
        <ESAStatusIndicator
          isActive={config.isActive}
          enforcementMode={config.enforcementMode}
          healthStatus={config.healthStatus}
          lastHealthCheck={config.lastHealthCheck}
        />
      )}
    </div>
  );
}
```

### 4. Add Compact Status to Header

```tsx
// src/components/Header.tsx
import { ESAStatusIndicator } from "@/features/trust";
import { useESAConfig } from "@/features/trust";

export function Header() {
  const { data: config } = useESAConfig();

  return (
    <header className="border-b">
      <div className="flex items-center justify-between p-4">
        <h1>Kaizen Studio</h1>
        {config && (
          <ESAStatusIndicator {...config} compact className="ml-auto" />
        )}
      </div>
    </header>
  );
}
```

## Using Hooks

### Get ESA Configuration

```tsx
import { useESAConfig } from "@/features/trust";

function MyComponent() {
  const { data, isPending, error } = useESAConfig();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No ESA configured</div>;

  return <div>ESA Agent: {data.agentId}</div>;
}
```

### Update ESA Configuration

```tsx
import { useUpdateESAConfig } from "@/features/trust";
import { EnforcementMode } from "@/features/trust";

function MyComponent() {
  const { mutate: updateConfig, isPending } = useUpdateESAConfig();

  const handleUpdate = () => {
    updateConfig(
      {
        enforcementMode: EnforcementMode.ENFORCE,
        isActive: true,
      },
      {
        onSuccess: () => console.log("Updated!"),
        onError: (error) => console.error(error),
      }
    );
  };

  return (
    <button onClick={handleUpdate} disabled={isPending}>
      Enable Enforcement
    </button>
  );
}
```

### Test ESA Connection

```tsx
import { useTestESAConnection } from "@/features/trust";

function MyComponent() {
  const { mutate: testConnection, isPending } = useTestESAConnection();

  const handleTest = () => {
    testConnection(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          console.log(`Connected in ${result.latency}ms`);
        } else {
          console.error(result.error);
        }
      },
    });
  };

  return (
    <button onClick={handleTest} disabled={isPending}>
      Test Connection
    </button>
  );
}
```

## Common Patterns

### Conditional Rendering Based on ESA Status

```tsx
import { useESAConfig } from "@/features/trust";

function TrustProtectedFeature() {
  const { data: config } = useESAConfig();

  if (!config?.isActive) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        ESA is not active. This feature requires an active ESA.
      </div>
    );
  }

  return <div>Protected feature content...</div>;
}
```

### Show Warning for Inactive ESA

```tsx
import { useESAConfig, ESAStatusIndicator } from "@/features/trust";
import { AlertCircle } from "lucide-react";

function ESAWarning() {
  const { data: config } = useESAConfig();

  if (!config || config.isActive) return null;

  return (
    <div className="border border-yellow-500/20 bg-yellow-500/10 p-4 rounded">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <div className="flex-1">
          <h3 className="font-semibold">ESA Inactive</h3>
          <p className="text-sm mt-1">
            Trust enforcement is disabled. Configure ESA to enable trust
            operations.
          </p>
        </div>
        <ESAStatusIndicator {...config} compact />
      </div>
    </div>
  );
}
```

### Settings Page with Multiple Sections

```tsx
import { ESAConfigPanel } from "@/features/trust";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrustSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Trust Settings</h1>

      <Tabs defaultValue="esa">
        <TabsList>
          <TabsTrigger value="esa">ESA Configuration</TabsTrigger>
          <TabsTrigger value="policies">Trust Policies</TabsTrigger>
          <TabsTrigger value="audit">Audit Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="esa" className="mt-6">
          <ESAConfigPanel />
        </TabsContent>

        <TabsContent value="policies">{/* Other trust settings */}</TabsContent>

        <TabsContent value="audit">{/* Audit settings */}</TabsContent>
      </Tabs>
    </div>
  );
}
```

## TypeScript Types

### Import Types

```typescript
import type {
  ESAConfig,
  EnforcementMode,
  HealthStatus,
  ESAConnectionTestResult,
  ESAConfigFormData,
} from "@/features/trust";
```

### Type Usage

```typescript
// Function parameter
function handleConfigUpdate(config: ESAConfig) {
  console.log(
    `ESA ${config.agentId} is ${config.isActive ? "active" : "inactive"}`
  );
}

// Component props
interface MyComponentProps {
  enforcementMode: EnforcementMode;
  onModeChange: (mode: EnforcementMode) => void;
}

// State
const [config, setConfig] = useState<ESAConfig | null>(null);
```

## Styling Customization

### Custom Status Colors

```tsx
<ESAStatusIndicator {...config} className="border-2 border-primary" />
```

### Compact Mode Alignment

```tsx
<ESAStatusIndicator
  {...config}
  compact
  className="justify-end" // Right align
/>
```

## Error Handling

### Handle Loading and Error States

```tsx
import { useESAConfig } from "@/features/trust";
import { Alert, AlertDescription } from "@/components/ui/alert";

function MyComponent() {
  const { data, isPending, error } = useESAConfig();

  if (isPending) {
    return <div className="text-center p-8">Loading ESA configuration...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load ESA configuration: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>
          No ESA configured. Please configure an ESA to enable trust operations.
        </AlertDescription>
      </Alert>
    );
  }

  return <div>ESA configured successfully</div>;
}
```

### Handle Update Errors

```tsx
import { useUpdateESAConfig } from "@/features/trust";
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();
  const { mutate: updateConfig } = useUpdateESAConfig();

  const handleUpdate = (newConfig: Partial<ESAConfig>) => {
    updateConfig(newConfig, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "ESA configuration updated",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <button onClick={() => handleUpdate({ isActive: true })}>Update</button>
  );
}
```

## Best Practices

### 1. Always Check for ESA Existence

```tsx
const { data: config } = useESAConfig();

// Good
if (config) {
  // Use config
}

// Bad
config.isActive; // May throw error if null
```

### 2. Use Loading States

```tsx
const { isPending } = useESAConfig();

return (
  <button disabled={isPending}>
    {isPending ? "Loading..." : "Configure ESA"}
  </button>
);
```

### 3. Provide User Feedback

```tsx
const { toast } = useToast();

updateConfig(data, {
  onSuccess: () => toast({ title: "Success!" }),
  onError: () => toast({ title: "Error!", variant: "destructive" }),
});
```

### 4. Handle Null Config Gracefully

```tsx
const { data: config } = useESAConfig();

// Show different UI for missing config
if (!config) {
  return (
    <div>
      No ESA configured. <Link to="/settings/esa">Configure now</Link>
    </div>
  );
}

// Normal UI
return <ESAStatusIndicator {...config} />;
```

## Testing

### Mock ESA Config in Tests

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

const mockConfig: ESAConfig = {
  id: "1",
  agentId: "esa-agent-1",
  enforcementMode: EnforcementMode.ENFORCE,
  authorityId: "auth-1",
  defaultCapabilities: [],
  systemConstraints: [],
  isActive: true,
  lastHealthCheck: new Date().toISOString(),
  healthStatus: HealthStatus.HEALTHY,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("renders ESA status", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  queryClient.setQueryData(["esaConfig"], mockConfig);

  render(
    <QueryClientProvider client={queryClient}>
      <MyComponent />
    </QueryClientProvider>
  );

  // Assertions...
});
```

## Troubleshooting

### ESA Config Not Loading

1. Check API endpoint: `GET /api/v1/trust/esa/config`
2. Check network tab for errors
3. Verify authentication token
4. Check backend logs

### Connection Test Failing

1. Verify ESA agent is running
2. Check agent endpoint in config
3. Test network connectivity
4. Check ESA agent logs

### Save Not Working

1. Check form validation errors
2. Verify all required fields
3. Check API endpoint: `PUT /api/v1/trust/esa/config`
4. Check request payload format

## Additional Resources

- Full documentation: See `README.md`
- Usage examples: See `USAGE_EXAMPLE.tsx`
- Implementation details: See `IMPLEMENTATION_SUMMARY.md`
- Trust feature docs: `/src/features/trust/README.md`
