# API Keys Management

The API Keys feature provides secure management of API access tokens for programmatic access to Kaizen Studio.

## Overview

API Keys enable secure programmatic access to Kaizen Studio APIs. Features include:

- Create, regenerate, and revoke keys
- Scoped permissions per key
- Usage tracking and expiration
- Secure key reveal workflow

## Feature Structure

```
src/features/api-keys/
├── api.ts                    # API layer with apiKeysApi
├── hooks.ts                  # React Query hooks
├── types.ts                  # TypeScript interfaces
├── index.ts                  # Barrel export
└── components/
    ├── ApiKeyList.tsx        # Main list view
    ├── ApiKeyCard.tsx        # Individual key card
    ├── ApiKeyDialog.tsx      # Create dialog
    ├── ApiKeyForm.tsx        # Form component
    ├── ApiKeyRevealDialog.tsx # Secure key reveal
    └── __tests__/            # Component tests
```

## Types

```typescript
interface ApiKey {
  id: string;
  name: string;
  key: string;             // Masked: "kks_abc...xyz"
  prefix: string;          // "kks_abc" for identification
  permissions: string[];   // ['read', 'write']
  scopes: string[];       // ['agents', 'deployments']
  lastUsedAt?: string;
  expiresAt?: string;
  status: ApiKeyStatus;
  createdBy: string;
  createdAt: string;
}

type ApiKeyStatus = 'active' | 'revoked' | 'expired';

interface CreateApiKeyInput {
  name: string;
  permissions: string[];
  scopes: string[];
  expiresIn?: number;  // Days until expiration
}
```

## API Layer

```typescript
import { apiKeysApi } from '@/features/api-keys';

// List all keys
const keys = await apiKeysApi.getAll({ page: 1, status: 'active' });

// Create new key (returns full key ONCE)
const { key, fullKey } = await apiKeysApi.create({
  name: 'Production Access',
  permissions: ['read', 'write'],
  scopes: ['agents', 'deployments'],
});

// Regenerate key (invalidates old key)
const { key, fullKey } = await apiKeysApi.regenerate(keyId);

// Revoke key
await apiKeysApi.revoke(keyId);
```

## Hooks

```typescript
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useRegenerateApiKey,
} from '@/features/api-keys';

// List with filters
const { data, isPending } = useApiKeys({ status: 'active' });

// Create key
const createKey = useCreateApiKey();
const result = await createKey.mutateAsync({
  name: 'CI/CD Pipeline',
  permissions: ['read', 'write'],
  scopes: ['deployments'],
});
// result.fullKey is only available immediately after creation

// Revoke key
const revokeKey = useRevokeApiKey();
await revokeKey.mutateAsync(keyId);

// Regenerate key
const regenerateKey = useRegenerateApiKey();
const newKey = await regenerateKey.mutateAsync(keyId);
```

## Components

### ApiKeyList

Main view displaying all API keys in a card grid with filters.

```tsx
import { ApiKeyList } from '@/features/api-keys';

function ApiKeysPage() {
  return <ApiKeyList />;
}
```

### ApiKeyDialog

Modal for creating new API keys with scope and permission selection.

```tsx
import { ApiKeyDialog } from '@/features/api-keys';

function CreateKeyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create API Key</Button>
      <ApiKeyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### ApiKeyRevealDialog

Secure one-time key display with copy functionality.

```tsx
import { ApiKeyRevealDialog } from '@/features/api-keys';

// Automatically shown after key creation or regeneration
<ApiKeyRevealDialog
  apiKeyName="Production Access"
  fullKey="kks_abc123..."
  open={showReveal}
  onOpenChange={setShowReveal}
/>
```

## Security Considerations

1. **One-Time Display**: Full API key is only shown once after creation
2. **Key Masking**: List views only show key prefix for identification
3. **Immediate Invalidation**: Regenerating a key immediately invalidates the old one
4. **Scope Restrictions**: Keys can be limited to specific resources
5. **Expiration**: Optional automatic expiration for time-limited access

## Testing

The feature includes 23 tests covering:

- Key creation flow
- Secure key reveal
- Revocation and regeneration
- Permission and scope selection
- Status filtering
- Error handling

Run tests:

```bash
npm run test -- api-keys
```

## Related Features

- [Authentication](../04-authentication/README.md) - User authentication
- [Audit Logs](../11-audit/README.md) - Key usage tracking
