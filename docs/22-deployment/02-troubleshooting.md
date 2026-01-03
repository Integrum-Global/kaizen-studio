# Docker Troubleshooting Guide

Solutions for common issues when setting up Kaizen Studio with Docker.

## Port Already Allocated

**Error:**
```
Error response from daemon: Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Cause:** Another container or service is using the required port.

**Solution:**
```bash
# Find what's using the port
lsof -i :5432
docker ps | grep 5432

# Stop the conflicting container
docker stop <container_name>

# Or use a different port
POSTGRES_PORT=5433 docker-compose up -d
```

---

## Nginx: Host Not Found in Upstream

**Error:**
```
nginx: [emerg] host not found in upstream "backend" in /etc/nginx/conf.d/default.conf:51
```

**Cause:** Nginx tries to resolve the `backend` hostname at startup before Docker DNS is ready.

**Solution:** The `nginx.conf` must include Docker's internal DNS resolver:

```nginx
server {
    listen 80;

    # Required for Docker hostname resolution
    resolver 127.0.0.11 valid=30s ipv6=off;
    resolver_timeout 5s;

    location /api {
        # Use variable to force runtime DNS resolution
        set $backend_upstream http://backend:8000;
        proxy_pass $backend_upstream;
        # ... rest of proxy config
    }
}
```

**Key points:**
1. `resolver 127.0.0.11` - Docker's internal DNS server
2. `valid=30s` - Cache DNS for 30 seconds
3. Use `set $variable` with `proxy_pass` to force runtime resolution

---

## Web Container Shows Wrong Port Mapping

**Symptom:**
```
kaizen_web   ...   80/tcp   # Missing "0.0.0.0:3000->80/tcp"
```

**Cause:** Container was created before port was freed, or docker-compose cached old config.

**Solution:**
```bash
# Force recreate the container
docker-compose stop web
docker rm -f kaizen_web
docker-compose up -d web

# Verify
docker-compose ps
# Should show: 0.0.0.0:3000->80/tcp
```

---

## TypeScript Build Errors: Missing Modules

**Error:**
```
error TS2307: Cannot find module '@/lib/utils' or its corresponding type declarations
error TS2307: Cannot find module '@/lib/queryKeys'
error TS2307: Cannot find module './lib/queryClient'
```

**Cause:** The `apps/web/src/lib/` directory with required utility files is missing.

**Solution:** Ensure these files exist:

### `apps/web/src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `apps/web/src/lib/queryClient.ts`
```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### `apps/web/src/lib/queryKeys.ts`
```typescript
const queryKeys = {
  auth: {
    all: () => ["auth"] as const,
    current: () => [...queryKeys.auth.all(), "current"] as const,
    session: () => [...queryKeys.auth.all(), "session"] as const,
  },
  users: {
    all: () => ["users"] as const,
    lists: () => [...queryKeys.users.all(), "list"] as const,
    list: (filters?: object) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  // ... add other entities as needed
};

export default queryKeys;
```

---

## Container Keeps Restarting

**Symptom:**
```
kaizen_web   ...   Restarting (1) 2 seconds ago
```

**Diagnosis:**
```bash
# Check container logs
docker-compose logs web --tail=50

# Check exit code
docker inspect kaizen_web --format='{{.State.ExitCode}}'
```

**Common causes:**
1. Configuration error (nginx, etc.)
2. Missing dependencies
3. Health check failing

---

## Backend Not Accessible from Frontend

**Symptom:** Frontend shows network errors when calling API.

**Check:**
```bash
# Verify backend is healthy
docker-compose ps | grep backend

# Test from within the Docker network
docker-compose exec web curl http://backend:8000/health

# Test from host
curl http://localhost:8000/health
```

**Solutions:**
1. Ensure backend container is healthy
2. Check CORS settings in backend
3. Verify nginx proxy configuration

---

## Database Connection Failed

**Error:**
```
psycopg2.OperationalError: could not connect to server
```

**Check:**
```bash
# Verify postgres is running
docker-compose ps | grep postgres

# Test connection
docker-compose exec postgres pg_isready -U kaizen_dev

# Check logs
docker-compose logs postgres
```

**Solutions:**
1. Wait for postgres to be fully ready (health check)
2. Verify DATABASE_URL environment variable
3. Check postgres logs for authentication errors

---

## Git Merge Conflicts with Lock Files

**Error:**
```
error: Your local changes to the following files would be overwritten by merge:
    uv.lock
```

**Solution:**
```bash
# Stash local changes
git stash

# Pull latest
git pull origin main

# Optionally restore stashed changes
git stash pop
```

---

## Fresh Start (Nuclear Option)

When all else fails, start completely fresh:

```bash
# Stop everything
docker-compose down -v

# Remove all project containers
docker rm -f kaizen_backend kaizen_web kaizen_postgres kaizen_redis 2>/dev/null

# Remove project images
docker rmi kaizen-studio-backend kaizen-studio-web 2>/dev/null

# Remove project volumes
docker volume rm kaizen-studio_postgres_data kaizen-studio_redis_data 2>/dev/null

# Rebuild everything
docker-compose up -d --build
```

---

## DataFlow Table Creation Issues (DF-501)

**Error:**
```
ERROR:dataflow.core.engine:PostgreSQL enhanced schema management error for model 'X': ❌ DataFlow Error [DF-501]
ERROR: Task got Future attached to a different loop
```

**Cause:** DataFlow's migration system has async/sync event loop conflicts when running in FastAPI's async context. The `create_tables()` and `ensure_table_exists()` methods internally use sync LocalRuntime calls within async contexts.

**Solution:** The application uses `scripts/create_tables_sql.py` which bypasses DataFlow's complex migration system and creates tables directly via psycopg2. This is automatically run by `scripts/entrypoint.sh` before uvicorn starts.

**Root Cause Analysis:**
1. DataFlow's `_ensure_migration_tables()` detects async context but calls sync `execute()`
2. `AsyncLocalRuntime` is created but called with sync methods
3. Creates "Future attached to a different loop" errors
4. Tables never get created despite "ensured" messages

**Key Files:**
- `scripts/create_tables_sql.py` - Raw SQL table creation (workaround)
- `scripts/entrypoint.sh` - Runs table creation before uvicorn
- `src/studio/main.py` - No table creation in lifespan (handled by entrypoint)

---

## 422 Unprocessable Entity on /auth/me

**Symptom:**
```
GET /api/v1/auth/me HTTP/1.1" 422 Unprocessable Entity
{"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","details":{"errors":[{"field":"created_at","message":"Input should be a valid string"}]}}}
```

**Cause:** Pydantic v2 strict type validation. Fields like `mfa_enabled`, `status`, `created_at` were defined as `str = None` instead of `str | None = None`. In Pydantic v2, `str = None` means "string field with default None" but the value must still be a string when provided. To allow `None` as a valid value, use `str | None = None`.

**Solution:** Update the Pydantic model to use proper optional types:

```python
# Before (incorrect)
class UserResponse(BaseModel):
    status: str = None
    mfa_enabled: bool = None
    created_at: str = None

# After (correct)
class UserResponse(BaseModel):
    status: str | None = None
    mfa_enabled: bool | None = None
    created_at: str | None = None
```

**Key Files:**
- `src/studio/api/auth.py` - UserResponse model
- `src/studio/services/auth_service.py` - Type conversion for TEXT columns

---

## Boolean Fields Stored as TEXT

**Symptom:**
```python
# mfa_enabled is "false" (string) not False (boolean)
# Pydantic validation fails with type error
```

**Cause:** The `scripts/create_tables_sql.py` may create columns as TEXT instead of proper types (BOOLEAN, INTEGER, etc.) if the field type information is not correctly extracted from DataFlow model definitions.

**Solution:** Add type conversion in the service layer:

```python
# In auth_service.py get_user_by_id()
mfa_enabled = user.get("mfa_enabled")
if isinstance(mfa_enabled, str):
    mfa_enabled = mfa_enabled.lower() in ("true", "1", "yes")
elif mfa_enabled is None:
    mfa_enabled = False
```

**Key Files:**
- `src/studio/services/auth_service.py` - Type conversion logic
- `scripts/create_tables_sql.py` - `get_field_sql_type()` function

---

## Table Name Mismatch (Pluralization Bug)

**Symptom:**
```
WARNING:dataflow.core.nodes:CREATE UserIdentity failed with error: relation "user_identities" does not exist
```

**Cause:** The `scripts/create_tables_sql.py` pluralization was creating tables with incorrect names (e.g., `user_identitys` instead of `user_identities`).

**Solution:** This was fixed in the script with proper English pluralization rules. If you encounter this:

```bash
# Check for incorrectly named tables
docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio -c \
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%ys' ORDER BY tablename;"

# Rebuild backend to recreate tables with correct names
docker-compose up -d --build backend
```

**Pluralization Rules Applied:**
- Words ending in consonant + `y` → `ies` (identity → identities, policy → policies)
- Words ending in `s`, `x`, `z`, `ch`, `sh` → `es`
- Default: just add `s`

---

## AADSTS700025: Client is Public Error

**Error:**
```
AADSTS700025: Client is public so neither 'client_assertion' nor 'client_secret' should be presented.
```

**Cause:** Azure AD app is registered as a SPA (public client) but the backend uses `client_secret` (confidential client flow).

**Solution:** Reconfigure the Azure AD app registration:

```bash
# Login to Azure CLI
az login

# Move redirect URIs from SPA to Web platform
az ad app update --id YOUR_APP_ID \
  --web-redirect-uris "http://localhost:8000/auth/callback" "http://localhost:3000/auth/callback"

# Mark as confidential client
az ad app update --id YOUR_APP_ID --set isFallbackPublicClient=false

# Clear SPA redirect URIs (requires Graph API)
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/OBJECT_ID" \
  --body '{"spa": {"redirectUris": []}}'
```

**Key Points:**
- SPA (public client) uses PKCE, no client_secret
- Web (confidential client) uses client_secret
- Backend OAuth flows require confidential client configuration

---

## SSO Returns 503 Service Unavailable

**Symptom:**
```
GET http://localhost:3000/api/v1/sso/initiate/microsoft 503 (Service Unavailable)
```

**Common Causes:**
1. **Database tables don't exist** - Check `docker-compose logs backend` for "relation does not exist" errors
2. **Azure credentials not configured** - Check `.env` file has `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET`

**Solutions:**
1. Restart backend to trigger table creation: `docker-compose restart backend`
2. Verify `.env` file exists with Azure credentials
3. Check database tables: `docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio -c "\dt"`

---

## 403 Forbidden on All Protected Endpoints

**Symptom:**
```
GET http://localhost:3000/api/v1/pipelines?organization_id=xxx 403 (Forbidden)
GET http://localhost:3000/api/v1/agents 403 (Forbidden)
```

**Cause:** The user's role is not in the `PERMISSION_MATRIX`. SSO users who are the first from their domain are assigned `tenant_admin` role, but this role was missing from the permission configuration.

**Solution:** Ensure `tenant_admin` is in `src/studio/config/permissions.py`:

```python
PERMISSION_MATRIX = {
    "tenant_admin": [
        "organizations:*",
        "users:*",
        "agents:*",
        # ... all permissions like org_owner
    ],
    "org_owner": [...],
    # ...
}

VALID_ROLES = ["tenant_admin", "org_owner", "org_admin", "developer", "viewer"]
ADMIN_ROLES = ["tenant_admin", "org_owner", "org_admin"]
```

**Diagnosis:**
```bash
# Check user's role
docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio -c \
  "SELECT email, role FROM users;"

# Check if role_permissions table is populated
docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio -c \
  "SELECT * FROM role_permissions LIMIT 10;"
```

If `role_permissions` is empty, the RBAC service falls back to `PERMISSION_MATRIX`. Ensure the user's role exists in the matrix.

---

## Getting Help

1. Check container logs: `docker-compose logs -f <service>`
2. Check container status: `docker-compose ps`
3. Enter container for debugging: `docker-compose exec <service> sh`
4. Review Docker events: `docker events --filter container=kaizen_*`
