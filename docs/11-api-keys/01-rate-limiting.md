# Rate Limiting

## Overview

Rate limiting protects the API from abuse and ensures fair usage across all clients.

## How It Works

### Window-Based Limiting

Each API key has requests-per-minute limit:

```
Rate Limit: 100 requests/minute
Window: 60 seconds
```

### Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 45
```

### Exceeding Limit

When limit exceeded, returns 429:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 45

{
  "detail": "Rate limit exceeded. Retry after 45 seconds."
}
```

## Configuration

### Per-Key Limits

Set when creating key:

```json
{
  "name": "High Volume Key",
  "scopes": ["agents:read"],
  "rate_limit": 1000
}
```

### Default Limits

| Client Type | Default Limit |
|-------------|---------------|
| API Key | 100/min |
| User Session | 60/min |

## Rate Limit Model

```python
@db.model
class RateLimit:
    id: str
    key_id: str
    window_start: str
    request_count: int
    created_at: str
```

## Service Operations

```python
from studio.services.rate_limit_service import RateLimitService

service = RateLimitService()

# Check if allowed
allowed, remaining = await service.check_rate_limit(
    key_id="key-123",
    limit=100
)

if not allowed:
    # Return 429

# Increment counter
await service.increment("key-123")

# Get usage
usage = await service.get_usage("key-123")
# {"request_count": 45, "window_start": "..."}

# Reset (admin only)
await service.reset("key-123")
```

## Middleware

Rate limit middleware automatically:

1. Checks API key authentication
2. Gets key's rate limit
3. Checks current usage
4. Increments counter
5. Adds response headers

```python
from studio.middleware.rate_limit import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware)
```

## Handling Rate Limits

### Client-Side

```python
import time
import httpx

def make_request(url, headers):
    response = httpx.get(url, headers=headers)

    if response.status_code == 429:
        retry_after = int(response.headers.get("Retry-After", 60))
        time.sleep(retry_after)
        return make_request(url, headers)

    return response
```

### Exponential Backoff

```python
import random

def make_request_with_backoff(url, headers, max_retries=3):
    for attempt in range(max_retries):
        response = httpx.get(url, headers=headers)

        if response.status_code != 429:
            return response

        # Exponential backoff with jitter
        wait = (2 ** attempt) + random.uniform(0, 1)
        time.sleep(wait)

    raise Exception("Max retries exceeded")
```

## Monitoring Usage

### Check Key Usage

```bash
GET /api/v1/api-keys/{id}/usage
```

```json
{
  "key_id": "key-123",
  "window_start": "2024-01-15T10:00:00Z",
  "request_count": 75,
  "rate_limit": 100,
  "remaining": 25,
  "reset_at": "2024-01-15T10:01:00Z"
}
```

### Monitor Headers

Track `X-RateLimit-Remaining` to anticipate limits.

## Best Practices

1. **Appropriate limits** - Match key purpose
2. **Cache responses** - Reduce API calls
3. **Batch requests** - Combine where possible
4. **Handle 429s** - Implement retry logic
5. **Monitor usage** - Track patterns
6. **Request increases** - Contact support if needed
