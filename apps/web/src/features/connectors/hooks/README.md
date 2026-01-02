# Connector Hooks

React Query hooks for connector management following the established patterns from the teams feature.

## Hooks

### useConnectors(filters?: ConnectorFilters)

Fetches all connectors with optional filters.

```typescript
const { data, isLoading, error } = useConnectors({
  connector_type: "database",
  provider: "postgresql",
  status: "active",
});
```

### useConnector(id: string)

Fetches a single connector by ID.

```typescript
const { data: connector, isLoading } = useConnector("connector-123");
```

### useCreateConnector()

Creates a new connector.

```typescript
const createMutation = useCreateConnector();

createMutation.mutate({
  name: "Production DB",
  connector_type: "database",
  provider: "postgresql",
  config: {
    host: "localhost",
    port: 5432,
    database: "mydb",
    username: "user",
    password: "pass",
  },
  status: "active",
});
```

### useUpdateConnector()

Updates an existing connector.

```typescript
const updateMutation = useUpdateConnector();

updateMutation.mutate({
  id: "connector-123",
  input: {
    name: "Updated Name",
    status: "inactive",
  },
});
```

### useDeleteConnector()

Deletes a connector.

```typescript
const deleteMutation = useDeleteConnector();

deleteMutation.mutate("connector-123");
```

### useTestConnector()

Tests a connector connection.

```typescript
const testMutation = useTestConnector();

testMutation.mutate("connector-123", {
  onSuccess: (result) => {
    if (result.success) {
      console.log("Connection successful:", result.message);
    } else {
      console.error("Connection failed:", result.message);
    }
  },
});
```

## Query Invalidation

All mutations automatically invalidate relevant queries:

- Create: Invalidates connector list, adds new connector to cache
- Update: Invalidates list and updates detail cache
- Delete: Invalidates list and removes from cache
- Test: Invalidates detail and list (to refresh test status)

## Query Keys

Centralized query keys are managed in `@/lib/queryKeys`:

```typescript
queryKeys.connectors.all; // ['connectors']
queryKeys.connectors.lists(); // ['connectors', 'list']
queryKeys.connectors.list(filters); // ['connectors', 'list', { filters }]
queryKeys.connectors.details(); // ['connectors', 'detail']
queryKeys.connectors.detail(id); // ['connectors', 'detail', id]
queryKeys.connectors.types(); // ['connectors', 'types']
```

## Error Handling

All hooks include error handling with Axios error types:

```typescript
const { mutate, error } = useCreateConnector();

if (error) {
  console.error(error.response?.data?.detail || error.message);
}
```

## Stale Time

Query hooks use a 30-second stale time for optimal performance:

- Prevents unnecessary refetches
- Keeps data fresh for typical user interactions
- Can be overridden per-query if needed
