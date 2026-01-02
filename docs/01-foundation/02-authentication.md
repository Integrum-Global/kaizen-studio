# Authentication

## Overview

Kaizen Studio uses JWT-based authentication with RS256/HS256 signing, refresh token rotation, and Redis-backed token blacklisting.

## Token Types

### Access Token

Short-lived token for API authentication.

```python
# Configuration
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_ALGORITHM=HS256  # or RS256 with key pair
```

**Payload**:
```json
{
  "sub": "user-123",
  "organization_id": "org-456",
  "role": "developer",
  "exp": 1700000000,
  "iat": 1699999100
}
```

### Refresh Token

Long-lived token for obtaining new access tokens.

```python
# Configuration
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Authentication Flow

### Registration

```python
from studio.services.auth_service import AuthService

auth_service = AuthService()

# Register new user
user = await auth_service.register(
    email="user@example.com",
    password="SecurePass123!",
    name="John Doe",
    organization_id="org-456"
)
```

### Login

```python
# Authenticate and get tokens
tokens = await auth_service.login(
    email="user@example.com",
    password="SecurePass123!"
)

# Returns:
{
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 900
}
```

### Token Refresh

```python
# Get new access token using refresh token
new_tokens = await auth_service.refresh_token(refresh_token)
```

### Logout

```python
# Blacklist current tokens
await auth_service.logout(access_token)
```

## API Endpoints

### POST /api/v1/auth/register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

### POST /api/v1/auth/login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### POST /api/v1/auth/refresh

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJ..."
  }'
```

### POST /api/v1/auth/logout

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJ..."
```

### GET /api/v1/auth/me

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJ..."
```

## Password Security

### Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("SecurePass123!")

# Verify password
is_valid = pwd_context.verify("SecurePass123!", hashed)
```

### Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

## Token Blacklisting

Redis stores blacklisted tokens until expiration.

```python
import redis

redis_client = redis.from_url(settings.REDIS_URL)

# Blacklist token
async def blacklist_token(token: str, expires_in: int):
    redis_client.setex(f"blacklist:{token}", expires_in, "1")

# Check if blacklisted
async def is_blacklisted(token: str) -> bool:
    return redis_client.exists(f"blacklist:{token}")
```

## Middleware Integration

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    token = credentials.credentials

    # Check blacklist
    if await is_blacklisted(token):
        raise HTTPException(401, "Token revoked")

    # Decode and validate
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")

    # Load user
    user = await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(401, "User not found")

    return user
```

## Frontend Integration

### Axios Interceptors

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken,
        });
        localStorage.setItem('access_token', data.access_token);
        error.config.headers.Authorization = `Bearer ${data.access_token}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

## Security Best Practices

### Token Storage

- Store access token in memory or httpOnly cookie
- Store refresh token in httpOnly cookie with secure flag
- Never store tokens in localStorage for production

### HTTPS Only

- Set `Secure` flag on cookies
- Redirect HTTP to HTTPS
- Use HSTS headers

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    ...
```
