# Deployment Documentation

This section covers deploying and running Kaizen Studio in various environments.

## Contents

1. [Docker Setup](./01-docker-setup.md) - Complete Docker Compose development setup
2. [Troubleshooting](./02-troubleshooting.md) - Common issues and solutions
3. [Production Deployment](./03-production.md) - Production deployment guidelines (coming soon)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend   │    │   Backend   │    │  PostgreSQL │     │
│  │   (nginx)   │───▶│  (FastAPI)  │───▶│   Database  │     │
│  │   :3000     │    │   :8000     │    │   :5432     │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                │
│                            ▼                                │
│                     ┌─────────────┐                        │
│                     │    Redis    │                        │
│                     │   Cache     │                        │
│                     │   :6379     │                        │
│                     └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Rebuild | `docker-compose up -d --build` |
| Fresh start | `docker-compose down -v && docker-compose up -d --build` |

## Requirements

- Docker Desktop 4.0+
- Docker Compose v2+
- 4GB RAM minimum
- Ports 3000, 5432, 6379, 8000 available

## First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/Integrum-Global/kaizen-studio.git
cd kaizen-studio

# 2. Start services
docker-compose up -d

# 3. Wait for health checks (30-60 seconds)
docker-compose ps

# 4. Access the application
open http://localhost:3000
```

See [Docker Setup](./01-docker-setup.md) for detailed instructions.
