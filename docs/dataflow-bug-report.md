# DataFlow Bug Report: Async/Sync Event Loop Conflicts in Table Creation

**Report Date:** 2026-01-03
**DataFlow Version:** (installed via `pip install kailash-dataflow`)
**Environment:** Docker + FastAPI + PostgreSQL
**Severity:** Critical - Prevents table creation in async contexts
**Error Code:** DF-501

---

## Executive Summary

DataFlow's table creation and migration system has fundamental async/sync design flaws that prevent tables from being created when running in FastAPI's async context. The `create_tables()`, `ensure_table_exists()`, and related methods fail with "Future attached to a different loop" errors, leaving databases without tables despite "success" messages in logs.

**Impact:** Applications using DataFlow in Docker/FastAPI cannot create database tables through the intended API, requiring workarounds that bypass the entire migration system.

---

## Error Symptoms

### Primary Error Message
```
ERROR:kailash.runtime.base:Node create_migration_table_0 failed: Database query failed:
Task <Task pending name='Task-XXX' coro=<LocalRuntime._execute_async() running at
/usr/local/lib/python3.12/site-packages/kailash/runtime/local.py:1489>
cb=[_run_until_complete_cb() at /usr/local/lib/python3.12/asyncio/base_events.py:181]>
got Future <Future pending cb=[BaseProtocol._on_waiter_completed()]> attached to a different loop
```

### Secondary Error (DF-501)
```
ERROR:dataflow.core.engine:PostgreSQL enhanced schema management error for model 'X':
❌ DataFlow Error [DF-501]
Runtime execution error

📍 Context:
  operation: schema_management_fallback

🔗 Original Error:
  Exception: Enhanced schema management requires fallback to migration system for 1 operations
```

### Misleading Success Messages
The logs show `✓ Ensured table exists for ModelName` even when no table was created. This is because `ensure_table_exists()` marks models as "ensured" in the schema cache regardless of whether the DDL actually executed.

---

## Root Cause Analysis

### Issue 1: `_ensure_migration_tables()` - Async Detection but Sync Execution

**File:** `dataflow/core/engine.py` (Lines ~4798-4916)

```python
def _ensure_migration_tables(self, database_type: str = None):
    """Ensure both migration tracking tables exist."""
    try:
        # ✅ Correctly detects async context
        try:
            asyncio.get_running_loop()
            runtime = AsyncLocalRuntime()  # Creates async runtime
            is_async = True
        except RuntimeError:
            runtime = LocalRuntime()
            is_async = False

        # ... build workflow ...

        # ❌ BUG: Calls sync execute() even when is_async=True!
        results, _ = runtime.execute(workflow.build())  # Line ~4876
```

**Problem:** The code correctly detects an async context and creates `AsyncLocalRuntime()`, but then calls the synchronous `execute()` method instead of `await execute_workflow_async()`. This causes the event loop conflict.

**Expected Behavior:** When `is_async=True`, should use:
```python
results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
```

---

### Issue 2: ThreadPoolExecutor + asyncio.run() Creates New Event Loops

**File:** `dataflow/core/engine.py` (Lines ~4030-4042 and ~4290-4303)

```python
# In _trigger_sqlite_schema_management() and _trigger_postgresql_migration_system()
try:
    loop = asyncio.get_running_loop()
    # ❌ BUG: Creates new event loop in different thread!
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(asyncio.run, run_sqlite_migration())
        success, migrations = future.result()
except RuntimeError:
    success, migrations = asyncio.run(run_sqlite_migration())
```

**Problem:** Submitting `asyncio.run()` to a `ThreadPoolExecutor` while an event loop is running creates a **new event loop in a different thread**. Database connection pools are tied to the original event loop, causing "Future attached to a different loop" errors.

**Impact:** All connections created in the new thread cannot be used, and the migration silently fails.

---

### Issue 3: Deprecated `asyncio.get_event_loop()` Usage

**File:** `dataflow/core/engine.py` (Lines ~4382-4393)

```python
# In _build_incremental_target_schema()
try:
    loop = asyncio.get_event_loop()  # ❌ Deprecated in Python 3.10+
    current_schema = loop.run_until_complete(
        self._migration_system.inspector.get_current_schema()
    )
except RuntimeError:
    loop = asyncio.new_event_loop()  # ❌ Creates new loop
    asyncio.set_event_loop(loop)     # ❌ Mutates global state!
    current_schema = loop.run_until_complete(...)
    loop.close()
```

**Problems:**
1. `asyncio.get_event_loop()` is deprecated and raises `DeprecationWarning` in Python 3.10+
2. `asyncio.new_event_loop()` + `asyncio.set_event_loop()` mutates global state, breaking existing async contexts
3. Cannot call `run_until_complete()` from within an already-running async context

---

### Issue 4: `discover_schema()` Intentionally Blocks in Async Contexts

**File:** `dataflow/core/engine.py` (Lines ~2570-2596)

```python
try:
    loop = asyncio.get_running_loop()
    if loop.is_running():
        # Raises error instead of providing async alternative
        raise RuntimeError(
            "discover_schema() cannot be called from a running async context. "
            "Use 'await discover_schema_async()' instead..."
        )
except RuntimeError as e:
    if "discover_schema() cannot be called" in str(e):
        raise
    # Uses asyncio.run() which creates new event loop
    discovered_schema = asyncio.run(self._inspect_database_schema_real())
```

**Problem:** While the error message mentions `discover_schema_async()`, this method may not be consistently available or used throughout the codebase, leading to dead ends when users try to follow the suggestion.

---

### Issue 5: Schema Cache Marks Tables as "Ensured" Before DDL Executes

**File:** `dataflow/core/engine.py` (in `ensure_table_exists()`)

The method marks tables as "ensured" in the schema cache based on entering the method, not on successful DDL execution. When the migration fallback fails, the table is still marked as ensured, causing:
1. Misleading log messages (`✓ Ensured table exists for X`)
2. Future calls skip table creation entirely (cache hit)
3. Application runs with missing tables

---

## Reproduction Steps

1. Create a FastAPI application with DataFlow:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dataflow import DataFlow

db = DataFlow(
    database_url="postgresql://user:pass@localhost:5432/mydb",
    auto_migrate=True,
)

@db.model
class Organization:
    id: str
    name: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Any of these will fail:
    # Option 1: create_tables() - sync method in async context
    db.create_tables()

    # Option 2: ensure_table_exists() - internally falls back to sync
    await db.ensure_table_exists("Organization")

    # Option 3: initialize() - doesn't create tables
    await db.initialize()

    yield

app = FastAPI(lifespan=lifespan)
```

2. Run with uvicorn: `uvicorn main:app`

3. Observe errors in logs and verify tables don't exist:
```sql
\dt  -- Shows no application tables
```

---

## Current Workaround

We had to bypass DataFlow's entire migration system and create tables using raw SQL via psycopg2:

```python
# scripts/create_tables_sql.py
import psycopg2
from studio.models import db

def create_tables():
    conn = psycopg2.connect(...)
    cursor = conn.cursor()

    for model_name in db._models.keys():
        model_info = db._models[model_name]
        fields = model_info["fields"]
        sql = generate_create_table_sql(model_name, fields)
        cursor.execute(sql)

    conn.commit()
```

This script runs **before** uvicorn starts (via Docker entrypoint), avoiding any async context.

---

## Proposed Fixes

### Fix 1: Add Proper Async Methods

Create async variants of all table creation methods:

```python
async def create_tables_async(self, database_type: str = None):
    """Async-safe table creation for use in FastAPI/async contexts."""
    # Use AsyncLocalRuntime with await execute_workflow_async()
    runtime = AsyncLocalRuntime()
    for model_name in self._models.keys():
        await self._ensure_table_exists_async(model_name)

async def _ensure_migration_tables_async(self, database_type: str = None):
    """Async version of migration table setup."""
    runtime = AsyncLocalRuntime()
    # ... build workflow ...
    results, _ = await runtime.execute_workflow_async(workflow.build(), inputs={})
```

### Fix 2: Fix Runtime Detection and Execution

In `_ensure_migration_tables()`, properly await async execution:

```python
def _ensure_migration_tables(self, database_type: str = None):
    try:
        loop = asyncio.get_running_loop()
        # We're in async context - schedule as task
        return asyncio.create_task(self._ensure_migration_tables_async(database_type))
    except RuntimeError:
        # No event loop - safe to use sync
        runtime = LocalRuntime()
        results, _ = runtime.execute(workflow.build())
```

### Fix 3: Remove ThreadPoolExecutor + asyncio.run() Pattern

Replace this pattern:
```python
with ThreadPoolExecutor() as executor:
    future = executor.submit(asyncio.run, async_func())
```

With proper async handling:
```python
# If in async context, just await
await async_func()

# If in sync context, use asyncio.run() directly (not in thread)
asyncio.run(async_func())
```

### Fix 4: Update Schema Cache Logic

Only mark tables as "ensured" **after** successful DDL execution:

```python
async def ensure_table_exists(self, model_name: str) -> bool:
    try:
        # Execute DDL
        await self._execute_postgresql_schema_management_async(model_name, fields)

        # Only cache on success
        self._schema_cache.mark_table_ensured(model_name, database_url, schema_checksum)
        return True
    except Exception as e:
        # Do NOT cache failures
        logger.error(f"Failed to create table for {model_name}: {e}")
        return False
```

### Fix 5: Deprecate Sync Methods in Favor of Async

Add deprecation warnings to sync methods when called from async contexts:

```python
def create_tables(self, ...):
    try:
        asyncio.get_running_loop()
        warnings.warn(
            "create_tables() called from async context. "
            "Use 'await create_tables_async()' instead.",
            DeprecationWarning
        )
    except RuntimeError:
        pass
    # ... existing logic
```

---

## Affected Code Locations

| File | Lines | Method | Issue |
|------|-------|--------|-------|
| `dataflow/core/engine.py` | ~4798-4916 | `_ensure_migration_tables()` | Async detection + sync execution |
| `dataflow/core/engine.py` | ~4030-4042 | `_trigger_sqlite_schema_management()` | ThreadPoolExecutor + asyncio.run() |
| `dataflow/core/engine.py` | ~4290-4303 | `_trigger_postgresql_migration_system()` | ThreadPoolExecutor + asyncio.run() |
| `dataflow/core/engine.py` | ~4382-4393 | `_build_incremental_target_schema()` | Deprecated get_event_loop() |
| `dataflow/core/engine.py` | ~2570-2596 | `discover_schema()` | Blocks in async contexts |
| `dataflow/core/engine.py` | ~898-1000 | `ensure_table_exists()` | Caches before DDL success |
| `dataflow/migrations/auto_migration_system.py` | Various | `auto_migrate()` | Same async/sync issues |

---

## Environment Details

- **Python:** 3.12
- **FastAPI:** Latest
- **PostgreSQL:** 15-alpine (Docker)
- **Runtime:** Docker Compose with uvicorn
- **OS:** macOS Darwin 25.1.0

---

## Additional Context

This issue affects **every project** using DataFlow with FastAPI or any async framework. The current architecture assumes sync-first execution, but modern Python web frameworks (FastAPI, Starlette, Quart) are async-first.

The docstrings in `DataFlow.__init__()` mention `await db.initialize_deferred_migrations()` but this method doesn't appear to exist, leaving users without a clear async pathway.

---

## Attachments

- Full investigation logs available
- Workaround implementation in `scripts/create_tables_sql.py`
- Test case reproduction available upon request

---

**Submitted by:** Kaizen Studio Development Team
**Contact:** [Your contact info]
