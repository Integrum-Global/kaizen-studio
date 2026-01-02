# Page Components

Page components orchestrate feature components and define route-level layouts.

## Directory Structure

```
src/pages/
├── Dashboard.tsx           # Main dashboard
├── admin/                  # Admin pages
│   ├── TeamsPage.tsx
│   ├── RolesPage.tsx
│   ├── PoliciesPage.tsx
│   ├── UsersPage.tsx
│   └── index.ts
├── agents/                 # Agent management
│   ├── AgentsPage.tsx
│   ├── AgentDetailPage.tsx
│   └── index.ts
├── auth/                   # Authentication
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── SSOCallbackPage.tsx
│   └── index.ts
├── infrastructure/         # Infrastructure management
│   ├── GatewaysPage.tsx
│   ├── DeploymentsPage.tsx
│   ├── ConnectorsPage.tsx
│   └── index.ts
├── observability/          # Monitoring & logs
│   ├── MetricsPage.tsx
│   ├── AuditPage.tsx
│   ├── LogsPage.tsx
│   └── index.ts
├── pipelines/              # Pipeline editor
│   ├── PipelinesPage.tsx
│   ├── PipelineEditorPage.tsx
│   └── index.ts
└── settings/               # User settings
    ├── SettingsPage.tsx
    ├── ApiKeysPage.tsx
    ├── WebhooksPage.tsx
    └── index.ts
```

## Page Pattern

```tsx
import { FeatureComponent } from "@/features/feature-name";
import { ResponsiveContainer } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ExamplePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Page Title
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Page description
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </div>

      {/* Feature Component */}
      <FeatureComponent />

      {/* Dialog */}
      <FeatureDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </ResponsiveContainer>
  );
}
```

## Route Configuration

Routes are defined in `App.tsx`:

```tsx
import { TeamsPage, RolesPage } from "./pages/admin";
import { MetricsPage, AuditPage } from "./pages/observability";

<Route
  element={
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  }
>
  {/* Admin */}
  <Route path="/teams" element={<TeamsPage />} />
  <Route path="/roles" element={<RolesPage />} />

  {/* Observability */}
  <Route path="/metrics" element={<MetricsPage />} />
  <Route path="/audit" element={<AuditPage />} />
</Route>
```

## Page Categories

### Build Pages
- `/agents` - Agent management and creation
- `/pipelines` - Pipeline list and editor
- `/connectors` - External integrations

### Deploy Pages
- `/deployments` - Deployment management
- `/gateways` - Gateway configuration

### Admin Pages
- `/teams` - Team management
- `/users` - User management
- `/roles` - Role configuration (RBAC)
- `/policies` - Policy management (ABAC)

### Observability Pages
- `/metrics` - Metrics dashboard
- `/audit` - Audit log viewer
- `/logs` - System logs

### Settings Pages
- `/settings` - User preferences
- `/api-keys` - API key management
- `/webhooks` - Webhook configuration

## Barrel Exports

Each page directory has an `index.ts`:

```typescript
// pages/admin/index.ts
export { TeamsPage } from "./TeamsPage";
export { RolesPage } from "./RolesPage";
export { PoliciesPage } from "./PoliciesPage";
export { UsersPage } from "./UsersPage";
```

## Best Practices

1. **Delegate to features** - Pages orchestrate, features implement
2. **Consistent headers** - Use same header pattern across pages
3. **Responsive containers** - Wrap content in ResponsiveContainer
4. **Dialog state at page level** - Manage modal state in pages
5. **Use barrel exports** - Keep App.tsx imports clean
