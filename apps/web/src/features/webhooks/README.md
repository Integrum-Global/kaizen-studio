# Webhooks Feature

A complete webhook management feature for the Kaizen Studio frontend, following the established patterns from the connectors feature.

## Overview

This feature enables users to:

- Create and manage webhooks for event notifications
- Subscribe to specific event types
- Test webhook deliveries
- View delivery history with retry functionality
- Manage webhook secrets (shown once on creation)

## Structure

```
webhooks/
├── types/
│   ├── webhook.ts          # TypeScript types and interfaces
│   └── index.ts            # Types barrel export
├── api/
│   ├── webhooks.ts         # API client functions
│   └── index.ts            # API barrel export
├── hooks/
│   ├── useWebhooks.ts      # React Query hooks
│   └── index.ts            # Hooks barrel export
├── components/
│   ├── WebhookCard.tsx     # Individual webhook card
│   ├── WebhookList.tsx     # List view with empty state
│   ├── WebhookForm.tsx     # Create/edit form
│   ├── WebhookDialog.tsx   # Dialog with secret display
│   ├── WebhookDeliveries.tsx  # Delivery history viewer
│   └── index.ts            # Components barrel export
├── index.ts                # Feature barrel export
└── README.md               # This file
```

## Types

### Core Types

- `WebhookStatus`: 'active' | 'inactive'
- `DeliveryStatus`: 'pending' | 'success' | 'failed'
- `Webhook`: Main webhook interface
- `WebhookWithSecret`: Webhook with secret (only on create)
- `WebhookDelivery`: Delivery record interface

### Request Types

- `CreateWebhookRequest`: { name, url, events }
- `UpdateWebhookRequest`: { name?, url?, events?, status? }
- `TestWebhookRequest`: { event_type? }

## API Functions

All functions use the `apiClient` from `@/api`:

- `getAll(filters?)`: Get all webhooks
- `getById(id)`: Get single webhook
- `create(input)`: Create new webhook (returns webhook with secret)
- `update(id, input)`: Update webhook
- `delete(id)`: Delete webhook
- `test(id, data?)`: Send test event
- `getEvents()`: Get available event types
- `getDeliveries(webhookId, limit?)`: Get delivery history
- `getDelivery(deliveryId)`: Get single delivery
- `retryDelivery(deliveryId)`: Retry failed delivery

## Hooks

All hooks use React Query for caching and state management:

### Query Hooks

- `useWebhooks(filters?)`: List webhooks
- `useWebhook(id)`: Get single webhook
- `useWebhookEvents()`: Get available events (5min cache)
- `useWebhookDeliveries(webhookId, limit?)`: Get deliveries
- `useWebhookDelivery(deliveryId)`: Get single delivery

### Mutation Hooks

- `useCreateWebhook()`: Create webhook
- `useUpdateWebhook()`: Update webhook
- `useDeleteWebhook()`: Delete webhook
- `useTestWebhook()`: Test webhook
- `useRetryDelivery()`: Retry failed delivery

## Components

### WebhookList

Main list component with:

- Create button in header
- Empty state with call-to-action
- Grid layout (responsive: 1/2/3 columns)
- Loading skeletons
- Error handling
- Toast notifications

### WebhookCard

Individual webhook card showing:

- Name and URL
- Status badge (active/inactive)
- Failure count badge (if failures exist)
- Subscribed events list
- Actions: Test, View Deliveries, Edit, Delete
- Created and last triggered dates

### WebhookDialog

Create/edit dialog with:

- Two-step flow for creation (form → secret display)
- Secret shown ONCE after creation with copy button
- Warning about secret visibility
- Form validation
- Loading states

### WebhookForm

Form component with:

- Name input (required, max 100 chars)
- URL input (required, validated URL)
- Events checkboxes (at least one required)
- Status select (update mode only)
- Loading events state
- Form validation with zod

### WebhookDeliveries

Delivery history dialog showing:

- List of recent deliveries
- Status badges with icons
- HTTP response status
- Duration and attempt count
- Collapsible payload and response
- Retry button for failed deliveries
- Empty state
- Loading skeletons

## Usage Example

```tsx
import { WebhookList } from "@/features/webhooks";

function WebhooksPage() {
  return <WebhookList />;
}
```

## Backend Integration

Integrates with the following backend endpoints:

- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks` - List webhooks
- `GET /api/webhooks/:id` - Get webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/test` - Test webhook
- `GET /api/webhooks/events` - List available events
- `GET /api/webhooks/:id/deliveries` - Get delivery history
- `GET /api/webhooks/deliveries/:id` - Get delivery
- `POST /api/webhooks/deliveries/:id/retry` - Retry delivery

## Features

### Security

- Webhook secret shown only once on creation
- Copy-to-clipboard functionality for secret
- Warning alerts about secret visibility

### User Experience

- Responsive design (mobile/tablet/desktop)
- Loading states with skeletons
- Empty states with helpful messages
- Toast notifications for all actions
- Confirmation dialogs for destructive actions
- Collapsible details for payloads/responses

### Error Handling

- API error display with toast notifications
- Graceful error states in UI
- Form validation with user-friendly messages
- Network error recovery

## Pattern Compliance

This feature follows all established patterns:

- ✅ Prettier formatting
- ✅ TypeScript strict mode
- ✅ React Query for data fetching
- ✅ Shadcn UI components
- ✅ Consistent file structure
- ✅ Barrel exports
- ✅ Query key management
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Loading and error states
