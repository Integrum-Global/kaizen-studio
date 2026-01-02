# Service Layer Patterns for DataFlow Integration

When creating records through DataFlow nodes, all string fields must be actual strings, not None. DataFlow validates node metadata and will reject None values for string fields.

## The Pattern

Instead of:
```python
# Anti-pattern: None for optional string fields
workflow.add_node(
    "ItemCreateNode",
    "create",
    {
        "id": item_id,
        "name": name,
        "description": data.get("description"),  # Returns None if missing
        "last_updated": None,  # None is not valid
    },
)
```

Use this:
```python
# Pattern: Use empty string for optional fields
workflow.add_node(
    "ItemCreateNode",
    "create",
    {
        "id": item_id,
        "name": name,
        "description": data.get("description") or "",  # Empty string if None
        "last_updated": "",  # Empty string for optional timestamps
    },
)
```

## Common Fields That Need This Pattern

### Timestamp Fields
```python
{
    "created_at": now,           # Required, has value
    "updated_at": now,           # Required, has value
    "last_login_at": "",         # Optional, use empty string
    "last_triggered_at": "",     # Optional, use empty string
    "deployed_at": "",           # Optional, use empty string
    "completed_at": "",          # Optional, use empty string
}
```

### Description and Text Fields
```python
{
    "name": data["name"],                           # Required
    "description": data.get("description") or "",   # Optional
    "error_message": "",                            # Optional
    "rejection_reason": "",                         # Optional
}
```

### URL Fields
```python
{
    "api_url": data["api_url"],                         # Required
    "health_check_url": data.get("health_check_url") or "",  # Optional
    "endpoint_url": "",                                  # Optional
}
```

### ID Reference Fields
```python
{
    "organization_id": data["organization_id"],  # Required
    "user_id": data["user_id"],                  # Required
    "approved_by": "",                           # Optional, filled when approved
    "target_deployment_id": "",                  # Optional, filled on execution
}
```

## Webhook Delivery Pattern

Webhook deliveries have a specific pattern where fields start empty and get updated:
```python
# Initial creation with defaults
workflow.add_node(
    "WebhookDeliveryCreateNode",
    "create_delivery",
    {
        "id": delivery_id,
        "webhook_id": webhook["id"],
        "event_type": event_type,
        "payload": payload,
        "status": "pending",
        "attempt_count": 0,
        "response_status": 0,   # 0 indicates not yet attempted
        "response_body": "",    # Will be filled after delivery
        "duration_ms": 0,       # Will be filled after delivery
    },
)

# After delivery attempt
workflow.add_node(
    "WebhookDeliveryUpdateNode",
    "update_delivery",
    {
        "filter": {"id": delivery_id},
        "fields": {
            "response_status": response.status_code,
            "response_body": response.text[:1000],
            "duration_ms": duration_ms,
            "status": "success" if success else "failed",
            "attempt_count": attempt + 1,
        },
    },
)
```

## Return Value Patterns

Service methods should return consistent types:
```python
async def create(self, data: dict) -> dict:
    # Create the record
    workflow = WorkflowBuilder()
    workflow.add_node(...)

    await self.runtime.execute_workflow_async(workflow.build(), inputs={})

    # Return with consistent field types
    return {
        "id": item_id,
        "name": data["name"],
        "description": data.get("description") or "",  # Never None
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
```

## Retry Logic Best Practices

When implementing retry logic (e.g., for webhooks), skip retries for client errors:
```python
for attempt in range(MAX_ATTEMPTS):
    try:
        response = await client.post(url, content=payload)
        success = 200 <= response.status_code < 300

        if success:
            break
        else:
            # Don't retry 4xx client errors
            if 400 <= response.status_code < 500:
                break

    except Exception as e:
        # Use 0 for response_status on connection errors
        response_status = 0
        # Don't retry connection errors (they usually persist)
        break
```
