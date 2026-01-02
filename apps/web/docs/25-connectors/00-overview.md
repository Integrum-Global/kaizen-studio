# Connectors Feature

External service connectors for agents and pipelines.

## Feature Location

```
src/features/connectors/
├── types/
│   └── connector.ts         # Type definitions
├── api/
│   └── connectors.ts        # API functions
├── hooks/
│   └── useConnectors.ts     # React Query hooks
├── components/
│   ├── ConnectorCard.tsx    # Connector display card
│   ├── ConnectorList.tsx    # List with filtering
│   ├── ConnectorDialog.tsx  # Create/edit modal
│   ├── ConnectorForm.tsx    # Form with validation
│   ├── ConnectorTestButton.tsx # Connection tester
│   └── __tests__/           # Component tests
└── index.ts                 # Barrel exports
```

## Types

### ConnectorType

```typescript
type ConnectorType =
  | "database"   // PostgreSQL, MySQL, MongoDB
  | "cloud"      // AWS, GCP, Azure
  | "email"      // SMTP, SendGrid, Mailgun
  | "messaging"  // Slack, Teams, Discord
  | "storage"    // S3, GCS, Azure Blob
  | "api";       // REST, GraphQL, SOAP
```

### ConnectorStatus

```typescript
type ConnectorStatus = "connected" | "disconnected" | "error" | "pending";
```

### Connector

```typescript
interface Connector {
  id: string;
  organization_id: string;
  name: string;
  connector_type: ConnectorType;
  provider: string;
  status: ConnectorStatus;
  last_tested_at?: string;
  last_test_result?: string;
  last_error?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

## Hooks

### useConnectors

```tsx
import { useConnectors } from "@/features/connectors";

function MyComponent() {
  const { data, isPending, error } = useConnectors({
    connector_type: "database",
    status: "connected",
  });

  if (isPending) return <Loading />;
  return <ConnectorList connectors={data.records} />;
}
```

### useCreateConnector

```tsx
import { useCreateConnector } from "@/features/connectors";

function CreateForm() {
  const createConnector = useCreateConnector();

  const handleSubmit = async (data) => {
    await createConnector.mutateAsync({
      name: "Production DB",
      connector_type: "database",
      provider: "postgresql",
      config: { host: "localhost", port: 5432 },
    });
  };
}
```

### useTestConnector

```tsx
import { useTestConnector } from "@/features/connectors";

function TestButton({ connectorId }) {
  const testConnector = useTestConnector();

  const handleTest = async () => {
    const result = await testConnector.mutateAsync(connectorId);
    console.log(result.success ? "Connected!" : result.message);
  };
}
```

## Components

### ConnectorList

Main list with filtering and pagination.

```tsx
import { ConnectorList } from "@/features/connectors";

<ConnectorList />
```

Features:
- Type filter dropdown
- Pagination
- Empty state
- Loading skeletons
- Card grid layout

### ConnectorCard

Individual connector display.

```tsx
import { ConnectorCard } from "@/features/connectors";

<ConnectorCard
  connector={connector}
  onEdit={(c) => openEditDialog(c)}
  onDelete={(id) => deleteConnector(id)}
  onTest={(c) => openTestDialog(c)}
/>
```

### ConnectorDialog

Create/edit modal.

```tsx
import { ConnectorDialog } from "@/features/connectors";

<ConnectorDialog
  mode="create"
  open={isOpen}
  onOpenChange={setIsOpen}
/>

<ConnectorDialog
  mode="edit"
  connector={selectedConnector}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### ConnectorForm

Form with dynamic config fields.

```tsx
import { ConnectorForm } from "@/features/connectors";

<ConnectorForm
  mode="create"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isSubmitting={isPending}
/>
```

Config fields change based on connector type:
- **Database**: host, port, database, username, password, ssl
- **Cloud**: provider, region, access keys
- **Email**: provider, host, port, from email
- **Messaging**: provider, webhook URL, bot token
- **Storage**: provider, bucket, region, credentials
- **API**: base URL, auth type, credentials

### ConnectorTestButton

Connection test dialog.

```tsx
import { ConnectorTestButton } from "@/features/connectors";

<ConnectorTestButton
  connector={connector}
  onClose={() => setShowTest(false)}
/>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/connectors | List connectors |
| GET | /api/v1/connectors/:id | Get connector |
| POST | /api/v1/connectors | Create connector |
| PUT | /api/v1/connectors/:id | Update connector |
| DELETE | /api/v1/connectors/:id | Delete connector |
| POST | /api/v1/connectors/:id/test | Test connection |

## Usage Example

```tsx
import {
  ConnectorList,
  ConnectorDialog,
  useConnectors,
} from "@/features/connectors";

function ConnectorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1>Connectors</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          Create Connector
        </Button>
      </div>

      <ConnectorList />

      <ConnectorDialog
        mode="create"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
```
