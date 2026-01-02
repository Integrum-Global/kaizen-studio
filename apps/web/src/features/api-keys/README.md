# API Keys Feature

Complete API Keys management feature for Kaizen Studio frontend.

## Structure

```
api-keys/
├── types/
│   ├── apiKey.ts           # TypeScript interfaces
│   └── index.ts            # Barrel export
├── api/
│   ├── apiKeys.ts          # API client methods
│   └── index.ts            # Barrel export
├── hooks/
│   ├── useApiKeys.ts       # React Query hooks
│   └── index.ts            # Barrel export
├── components/
│   ├── ApiKeyList.tsx      # Main list component with filters
│   ├── ApiKeyCard.tsx      # Individual key card
│   ├── ApiKeyDialog.tsx    # Create dialog
│   ├── ApiKeyForm.tsx      # Form component
│   ├── ApiKeyRevealDialog.tsx  # Show new key once
│   └── __tests__/
│       ├── ApiKeyList.test.tsx    # List tests
│       └── ApiKeyDialog.test.tsx  # Dialog tests
├── index.ts                # Feature barrel export
└── README.md              # This file
```

## Features

### Types

- **ApiKey**: Main API key interface with masked key, permissions, scopes, status
- **CreateApiKeyInput**: Input for creating new keys
- **ApiKeyFilters**: Search and filter parameters
- **ApiKeyResponse**: Paginated response
- **NewApiKeyResponse**: Response with full key (shown only once)

### API Methods

- `getAll(filters?)` - Get all API keys with pagination
- `getById(id)` - Get single API key
- `create(input)` - Create new API key
- `revoke(id)` - Revoke an API key
- `regenerate(id)` - Regenerate an API key

### Hooks

- `useApiKeys(filters?)` - Query hook for list
- `useApiKey(id)` - Query hook for single key
- `useCreateApiKey()` - Mutation hook for creation
- `useRevokeApiKey()` - Mutation hook for revocation
- `useRegenerateApiKey()` - Mutation hook for regeneration
- `apiKeyKeys` - Query key factory

### Components

#### ApiKeyList

- Search functionality
- Status filter (active, revoked, expired)
- Pagination
- Create button
- Loading skeletons
- Empty states

#### ApiKeyCard

- Displays masked key with copy button
- Shows permissions and scopes as badges
- Last used and expiration dates
- Dropdown menu with:
  - Regenerate (for active keys)
  - Revoke (for active keys)

#### ApiKeyDialog

- Form for creating new API keys
- Validates required fields
- Automatically shows reveal dialog on success

#### ApiKeyForm

- Name input
- Permission checkboxes (read, write, delete, admin)
- Scope checkboxes (agents, deployments, pipelines, api-keys)
- Optional expiration date picker
- Form validation with zod

#### ApiKeyRevealDialog

- Shows full API key only once after creation/regeneration
- Copy to clipboard button
- Warning message about saving the key
- Security alert

## Usage

```tsx
import { ApiKeyList } from "@/features/api-keys";

function ApiKeysPage() {
  return (
    <div className="container mx-auto py-8">
      <ApiKeyList />
    </div>
  );
}
```

## Testing

Both components have comprehensive test coverage:

- Loading states
- Empty states
- Error states
- Search and filtering
- Pagination
- Form validation
- API interactions
- Dialog open/close

Run tests:

```bash
npm test src/features/api-keys
```

## Patterns Followed

This feature strictly follows the patterns from the deployments and agents features:

- ✅ Barrel exports at every level
- ✅ React Query for all API calls
- ✅ shadcn/ui components
- ✅ TypeScript strict mode
- ✅ Loading skeletons
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Form validation with zod
- ✅ Test coverage
- ✅ One API call per component
