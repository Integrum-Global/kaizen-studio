# Webhooks Feature

Webhook management for receiving real-time event notifications.

## Feature Location

```
src/features/webhooks/
├── types/
│   └── webhook.ts           # Type definitions
├── api/
│   └── webhooks.ts          # API functions
├── hooks/
│   └── useWebhooks.ts       # React Query hooks
├── components/
│   ├── WebhookCard.tsx      # Webhook display card
│   ├── WebhookList.tsx      # List with filtering
│   ├── WebhookDialog.tsx    # Create/edit modal
│   ├── WebhookForm.tsx      # Form with validation
│   ├── WebhookDeliveries.tsx # Delivery history
│   └── __tests__/           # Component tests
└── index.ts                 # Barrel exports
```

## Types

### WebhookStatus

```typescript
type WebhookStatus = "active" | "inactive";
```

### DeliveryStatus

```typescript
type DeliveryStatus = "pending" | "success" | "failed";
```

### Webhook

```typescript
interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  last_triggered_at?: string;
  failure_count: number;
  created_by: string;
  created_at: string;
}
```

### WebhookDelivery

```typescript
interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: string;
  response_status?: number;
  response_body?: string;
  duration_ms?: number;
  status: DeliveryStatus;
  attempt_count: number;
  created_at: string;
}
```

## Hooks

### useWebhooks

```tsx
import { useWebhooks } from "@/features/webhooks";

function MyComponent() {
  const { data, isPending, error } = useWebhooks({
    status: "active",
    page: 1,
  });

  if (isPending) return <Loading />;
  return <WebhookList webhooks={data.records} />;
}
```

### useCreateWebhook

```tsx
import { useCreateWebhook } from "@/features/webhooks";

function CreateForm() {
  const createWebhook = useCreateWebhook();

  const handleSubmit = async (data) => {
    const result = await createWebhook.mutateAsync({
      name: "Production Webhook",
      url: "https://example.com/webhook",
      events: ["agent.created", "agent.updated"],
    });
    // result includes secret (only shown once)
    console.log(result.secret);
  };
}
```

### useTestWebhook

```tsx
import { useTestWebhook } from "@/features/webhooks";

function TestButton({ webhookId }) {
  const testWebhook = useTestWebhook();

  const handleTest = async () => {
    const result = await testWebhook.mutateAsync({
      id: webhookId,
      event_type: "test.event",
    });
    console.log(result.delivery.status);
  };
}
```

### useWebhookDeliveries

```tsx
import { useWebhookDeliveries } from "@/features/webhooks";

function DeliveryHistory({ webhookId }) {
  const { data, isPending } = useWebhookDeliveries(webhookId, {
    page: 1,
    page_size: 10,
  });

  return <DeliveryList deliveries={data?.records} />;
}
```

## Components

### WebhookList

Main list with filtering and pagination.

```tsx
import { WebhookList } from "@/features/webhooks";

<WebhookList />
```

Features:
- Status filter (active/inactive)
- Pagination
- Empty state
- Loading skeletons
- Card grid layout

### WebhookCard

Individual webhook display.

```tsx
import { WebhookCard } from "@/features/webhooks";

<WebhookCard
  webhook={webhook}
  onEdit={(w) => openEditDialog(w)}
  onDelete={(id) => deleteWebhook(id)}
  onTest={(w) => testWebhook(w)}
  onViewDeliveries={(w) => showDeliveries(w)}
/>
```

### WebhookDialog

Create/edit modal.

```tsx
import { WebhookDialog } from "@/features/webhooks";

<WebhookDialog
  mode="create"
  open={isOpen}
  onOpenChange={setIsOpen}
/>

<WebhookDialog
  mode="edit"
  webhook={selectedWebhook}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

### WebhookDeliveries

Delivery history viewer.

```tsx
import { WebhookDeliveries } from "@/features/webhooks";

<WebhookDeliveries
  webhook={webhook}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/webhooks | List webhooks |
| GET | /api/v1/webhooks/:id | Get webhook |
| POST | /api/v1/webhooks | Create webhook |
| PUT | /api/v1/webhooks/:id | Update webhook |
| DELETE | /api/v1/webhooks/:id | Delete webhook |
| POST | /api/v1/webhooks/:id/test | Test webhook |
| GET | /api/v1/webhooks/:id/deliveries | Get deliveries |
| GET | /api/v1/webhooks/events | Get available events |

## Events

Available webhook event types:
- `agent.created` - Agent created
- `agent.updated` - Agent updated
- `agent.deleted` - Agent deleted
- `pipeline.created` - Pipeline created
- `pipeline.executed` - Pipeline executed
- `deployment.created` - Deployment created
- `deployment.status_changed` - Deployment status changed

## Usage Example

```tsx
import {
  WebhookList,
  WebhookDialog,
  useWebhooks,
} from "@/features/webhooks";

function WebhooksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1>Webhooks</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          Create Webhook
        </Button>
      </div>

      <WebhookList />

      <WebhookDialog
        mode="create"
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
```
