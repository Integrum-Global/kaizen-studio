# Project Setup

## Directory Structure

```
apps/kaizen-studio/
├── src/
│   └── studio/              # Backend (FastAPI + DataFlow)
├── apps/
│   └── frontend/            # Frontend (React + TypeScript)
├── tests/                   # 3-tier test suite
├── docs/                    # Documentation
└── todos/                   # Todo tracking
```

## Backend Setup

### Install Dependencies

```bash
cd apps/kaizen-studio
pip install -e ".[dev]"
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://kailash_user:password@localhost:5432/kaizen_studio
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-secret-key-minimum-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

### Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis.

### Run Backend

```bash
uvicorn studio.main:app --reload --port 8000
```

### Verify

```bash
curl http://localhost:8000/health
# {"status": "healthy", "version": "0.1.0"}
```

## Frontend Setup

### Install Dependencies

```bash
cd apps/kaizen-studio/apps/web
npm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
VITE_API_URL=http://localhost:8000
```

### Run Frontend

```bash
npm run dev
```

Frontend runs on http://localhost:3000.

## Running Tests

### Prerequisites

Ensure PostgreSQL and Redis are running:

```bash
docker-compose up -d
```

### Run All Tests

```bash
pytest tests/ -v
```

### Run by Tier

```bash
# Tier 1: Unit (fast, no infrastructure)
pytest tests/unit/ -v

# Tier 2: Integration (requires database)
pytest tests/integration/ -v

# Tier 3: E2E (complete workflows)
pytest tests/e2e/ -v
```

### Coverage Report

```bash
pytest tests/ --cov=src/studio --cov-report=html
open htmlcov/index.html
```

## Development Workflow

### Adding a New Model

1. Create model in `src/studio/models/`
2. Add to `src/studio/models/__init__.py`
3. Create unit tests in `tests/unit/`
4. Create integration tests in `tests/integration/`

### Adding a New API Endpoint

1. Create route in `src/studio/api/`
2. Add to router in `src/studio/main.py`
3. Create service in `src/studio/services/` if needed
4. Create tests for all tiers

### Testing Guidelines

- **Tier 1**: Test pure functions, no database
- **Tier 2**: Test with real database, NO MOCKING
- **Tier 3**: Test complete user flows, NO MOCKING
