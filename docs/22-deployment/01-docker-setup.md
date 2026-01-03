# Docker Development Setup

Complete guide for setting up and running Kaizen Studio with Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2+
- Git
- At least 4GB RAM available for Docker

## Quick Start

```bash
# 1. Clone and enter the repository
git clone https://github.com/Integrum-Global/kaizen-studio.git
cd kaizen-studio

# 2. Check for port conflicts (see Port Conflicts section below)
docker ps | grep -E "5432|6379|8000|3000"

# 3. Start all services
docker-compose up -d

# 4. Verify all containers are healthy
docker-compose ps
```

## Services Overview

| Service | Container Name | Internal Port | External Port | Description |
|---------|---------------|---------------|---------------|-------------|
| PostgreSQL | kaizen_postgres | 5432 | 5432 | Database |
| Redis | kaizen_redis | 6379 | 6379 | Cache/Sessions |
| Backend | kaizen_backend | 8000 | 8000 | FastAPI API |
| Frontend | kaizen_web | 80 | 3000 | React SPA |

## Port Conflicts

Before starting, ensure these ports are available:
- **5432** - PostgreSQL
- **6379** - Redis
- **8000** - Backend API
- **3000** - Frontend

### Check for Conflicts

```bash
# Check what's using the required ports
lsof -i :5432 -i :6379 -i :8000 -i :3000

# Check for conflicting Docker containers
docker ps | grep -E "5432|6379|8000|3000"
```

### Resolve Conflicts

```bash
# Stop specific conflicting containers
docker stop <container_name>

# Or stop all containers from another project
cd /path/to/other/project
docker-compose down

# Alternative: Use different ports via environment variables
POSTGRES_PORT=5433 REDIS_PORT=6380 BACKEND_PORT=8001 FRONTEND_PORT=3001 docker-compose up -d
```

## Environment Configuration

The default configuration works out-of-the-box for development. For customization, create a `.env` file:

```bash
# Database
POSTGRES_USER=kaizen_dev
POSTGRES_PASSWORD=kaizen_dev_password
POSTGRES_DB=kaizen_studio
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=kaizen_redis_password
REDIS_PORT=6379

# Backend
BACKEND_PORT=8000
JWT_SECRET_KEY=dev_secret_key_for_local_development_only_change_in_production
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=info

# Frontend
FRONTEND_PORT=3000

# LLM API Keys (optional for AI features)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Azure AD SSO (optional)
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
AZURE_TENANT_ID=common
```

## Common Commands

```bash
# Start all services
docker-compose up -d

# Start specific service (with dependencies)
docker-compose up -d backend

# View logs
docker-compose logs -f
docker-compose logs -f backend  # specific service

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build web

# Check container health
docker-compose ps

# Execute command in container
docker-compose exec backend bash
docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio
```

## Database Initialization

The backend automatically creates all database tables on startup via the entrypoint script (`scripts/entrypoint.sh`). This happens before uvicorn starts to avoid async/sync event loop conflicts with DataFlow's migration system.

**What happens on startup:**
1. `entrypoint.sh` waits for database to be ready
2. `scripts/create_tables_sql.py` creates all 46+ tables using raw SQL
3. Uvicorn starts the FastAPI application
4. Health check passes when database and Redis are accessible

**If tables are missing:**
```bash
# Force table recreation by restarting the backend
docker-compose restart backend

# Check if tables exist
docker-compose exec postgres psql -U kaizen_dev -d kaizen_studio -c "\dt"
```

---

## Verification

After starting, verify all services are running:

```bash
# Check container status (all should show "healthy")
docker-compose ps

# Test frontend
curl http://localhost:3000/health
# Expected: OK

# Test backend API docs
curl http://localhost:8000/docs | head -5
# Expected: HTML content

# Test database connection
docker-compose exec postgres pg_isready -U kaizen_dev
# Expected: accepting connections
```

## Access Points

Once running:

| Service | URL |
|---------|-----|
| Frontend App | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Documentation | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

## Troubleshooting

See [02-troubleshooting.md](./02-troubleshooting.md) for common issues and solutions.
