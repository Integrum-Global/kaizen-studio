# Local Development Deployment

This guide covers running Kaizen Studio locally using Docker Compose.

## Prerequisites

- Docker Desktop 4.0+
- Docker Compose v2.0+
- 4GB RAM minimum
- Ports available: 3000, 5432, 6379, 8000

## Quick Start

```bash
# Navigate to kaizen-studio directory
cd apps/kaizen-studio

# Start all services
docker-compose up -d

# Verify services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES               STATUS                    PORTS
kaizen_web     Up (healthy)              0.0.0.0:3000->80/tcp
kaizen_backend      Up (healthy)              0.0.0.0:8000->8000/tcp
kaizen_postgres     Up (healthy)              0.0.0.0:5432->5432/tcp
kaizen_redis        Up (healthy)              0.0.0.0:6379->6379/tcp
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                    (kaizen_network)                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Frontend   │    │   Backend    │    │  PostgreSQL  │   │
│  │   (nginx)    │───▶│  (uvicorn)   │───▶│              │   │
│  │   :3000      │    │   :8000      │    │   :5432      │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                                │
│         │                   │            ┌──────────────┐   │
│         │                   └───────────▶│    Redis     │   │
│         │                                │   :6379      │   │
│         │                                └──────────────┘   │
│         │                                                    │
│         └─────────/api───────────────────────────────────▶  │
│                   (nginx proxy)                              │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Files

### Environment Variables (.env)

Create `.env` in kaizen-studio root:

```env
# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info

# PostgreSQL
POSTGRES_USER=kaizen_dev
POSTGRES_PASSWORD=kaizen_dev_password
POSTGRES_DB=kaizen_studio
POSTGRES_PORT=5432
DATABASE_URL=postgresql://kaizen_dev:kaizen_dev_password@postgres:5432/kaizen_studio

# Redis
REDIS_PASSWORD=kaizen_redis_password
REDIS_PORT=6379
REDIS_URL=redis://:kaizen_redis_password@redis:6379

# JWT Authentication
JWT_SECRET_KEY=dev_secret_key_for_local_development_only_change_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

### Docker Compose (docker-compose.yml)

The full stack includes:
- **postgres**: PostgreSQL 15 database
- **redis**: Redis 7 cache with authentication
- **backend**: FastAPI application with uvicorn
- **frontend**: React app served via nginx

### Backend Dockerfile

Key configuration points:

```dockerfile
# Python path for module resolution
ENV PYTHONPATH=/app/src

# Non-root user for security
USER kaizen

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

### Frontend Nginx Configuration

Located at `apps/web/nginx.conf`:
- Serves SPA with fallback to index.html
- Proxies /api requests to backend
- Proxies /ws WebSocket connections
- Security headers configured
- Gzip compression enabled

## Service Management

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with build
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 50 lines
docker logs kaizen_backend --tail 50
```

### Rebuild Services

```bash
# Rebuild single service
docker-compose build backend --no-cache

# Rebuild all services
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

## Health Checks

### Backend Health

```bash
curl http://localhost:8000/health
```

Response:
```json
{"status":"healthy","version":"0.1.0","environment":"development"}
```

### Frontend Health

```bash
curl http://localhost:3000/health
```

Response:
```
OK
```

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Database Access

### Connect via psql

```bash
# From host
PGPASSWORD=kaizen_dev_password psql -h localhost -U kaizen_dev -d kaizen_studio

# From container
docker exec -it kaizen_postgres psql -U kaizen_dev -d kaizen_studio
```

### Common Queries

```sql
-- List tables
\dt

-- Check model registry
SELECT * FROM dataflow_model_registry;

-- Check users
SELECT id, email, name FROM users LIMIT 10;
```

## Redis Access

```bash
# From host
redis-cli -h localhost -p 6379 -a kaizen_redis_password

# From container
docker exec -it kaizen_redis redis-cli -a kaizen_redis_password
```

## Troubleshooting

### Backend Won't Start

1. Check logs:
```bash
docker logs kaizen_backend --tail 100
```

2. Common issues:
   - **Module not found**: Verify PYTHONPATH is set in Dockerfile
   - **Database connection**: Check postgres is healthy first
   - **Missing dependencies**: Rebuild the image

### Frontend Build Fails

1. Check for TypeScript errors:
```bash
cd apps/web && npm run type-check
```

2. Verify tsconfig.json is not in .dockerignore

### Database Connection Issues

1. Check postgres is healthy:
```bash
docker-compose ps postgres
```

2. Verify connection string:
```bash
docker exec kaizen_backend printenv DATABASE_URL
```

### Port Conflicts

Check if ports are in use:
```bash
lsof -i :3000
lsof -i :8000
lsof -i :5432
lsof -i :6379
```

Stop conflicting services or change ports in .env:
```env
BACKEND_PORT=8001
FRONTEND_PORT=3001
POSTGRES_PORT=5433
```

## Development Workflow

### Backend Development

1. Mount source code for hot reload:
```yaml
# docker-compose.yml backend service
volumes:
  - ./src:/app/src:ro
```

2. Rebuild after dependency changes:
```bash
docker-compose build backend && docker-compose up -d backend
```

### Frontend Development

For faster iteration, run frontend locally:

```bash
cd apps/web
npm install
npm run dev  # Runs on http://localhost:5173
```

Configure vite.config.ts to proxy API calls to Docker backend:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

## Resource Requirements

| Service  | Memory | CPU |
|----------|--------|-----|
| postgres | 256MB  | 0.5 |
| redis    | 64MB   | 0.1 |
| backend  | 512MB  | 1.0 |
| frontend | 128MB  | 0.2 |

Total: ~1GB RAM minimum
