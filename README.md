# Kaizen Studio

AI Agent Platform Backend - Built with FastAPI and DataFlow.

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Python 3.12+ (for local development)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)

# Update .env with generated secrets
sed -i '' "s/change_this_to_a_secure_random_key_minimum_32_characters/$JWT_SECRET/" .env
sed -i '' "s/change_this_to_a_secure_password/$POSTGRES_PASSWORD/" .env
sed -i '' "s/change_this_to_a_secure_redis_password/$REDIS_PASSWORD/" .env
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:8000/health
```

### 3. API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user and organization |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout and blacklist tokens |
| GET | `/api/v1/auth/me` | Get current user |

## Architecture

### Backend Structure

```
src/studio/
  __init__.py
  main.py                 # FastAPI application
  config.py               # Pydantic settings
  models/
    __init__.py           # DataFlow instance
    organization.py       # Organization model
    user.py               # User model
    workspace.py          # Workspace model
  api/
    __init__.py
    auth.py               # Authentication endpoints
  services/
    __init__.py
    auth_service.py       # JWT & auth logic
  middleware/
    __init__.py
    auth.py               # Auth middleware
```

### DataFlow Models

All models use DataFlow's `@db.model` decorator which automatically generates 11 node types per model:

- **Organization**: Multi-tenant support
- **User**: Authentication and authorization
- **Workspace**: Environment isolation

### Authentication

- JWT tokens with RS256 algorithm (HS256 for development)
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Token blacklisting via Redis

## Development

### Local Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Start infrastructure
docker-compose up -d postgres redis

# Run application
python -m studio.main
```

### Running Tests

```bash
# Install test dependencies
pip install -e ".[test]"

# Run tests
pytest

# With coverage
pytest --cov=studio --cov-report=html
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://...` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET_KEY` | JWT signing secret (32+ chars) | Required |
| `JWT_ALGORITHM` | JWT algorithm (HS256/RS256) | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `15` |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

## License

MIT License
