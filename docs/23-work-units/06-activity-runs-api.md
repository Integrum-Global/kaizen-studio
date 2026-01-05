# Activity and Runs API

Phase 14 implementation of activity tracking and run history endpoints for the EATP Ontology.

## Overview

This phase implements the backend infrastructure for:
- Work unit execution runs (create, track, complete/fail)
- Activity feeds (team activity, user activity)
- Activity summaries (run statistics)
- Workspace member and work unit management

## DataFlow Models

### Run Model (`src/studio/models/run.py`)

Tracks individual work unit executions:

```python
@db.model
class Run:
    id: str                      # Primary key
    organization_id: str         # Organization context
    work_unit_id: str           # Agent or pipeline being executed
    work_unit_type: str         # "atomic" or "composite"
    work_unit_name: str         # Display name
    user_id: str                # User who initiated
    user_name: str | None       # User display name
    status: str                 # pending, running, completed, failed, cancelled
    input_data: str | None      # JSON string of input
    output_data: str | None     # JSON string of output
    error: str | None           # Error message if failed
    error_type: str | None      # Error type if failed
    started_at: str             # ISO 8601 timestamp
    completed_at: str | None    # ISO 8601 timestamp
    execution_metric_id: str | None  # Link to ExecutionMetric
    created_at: str             # Auto-managed by DataFlow
    updated_at: str             # Auto-managed by DataFlow
```

### WorkspaceMember Model (`src/studio/models/workspace_member.py`)

Junction table for workspace membership:

```python
@db.model
class WorkspaceMember:
    id: str
    workspace_id: str
    user_id: str
    role: str                   # owner, admin, member, viewer
    constraints: str | None     # JSON EATP constraints
    invited_by: str | None
    department: str | None      # Cross-org visibility
    created_at: str
    updated_at: str
```

### WorkspaceWorkUnit Model (`src/studio/models/workspace_work_unit.py`)

Links work units to workspaces:

```python
@db.model
class WorkspaceWorkUnit:
    id: str
    workspace_id: str
    work_unit_id: str
    work_unit_type: str         # atomic, composite
    delegation_id: str | None   # EATP trust reference
    constraints: str | None     # JSON access constraints
    added_by: str
    department: str | None
    created_at: str
    updated_at: str
```

## Services

### RunService (`src/studio/services/run_service.py`)

Manages run lifecycle:

```python
class RunService:
    async def create_run(...) -> dict
    async def get_run(run_id: str) -> dict | None
    async def mark_running(run_id: str) -> dict | None
    async def mark_completed(run_id: str, output_data: dict = None) -> dict | None
    async def mark_failed(run_id: str, error: str, error_type: str = None) -> dict | None
    async def list_runs(organization_id: str, ...) -> dict
    async def get_recent_runs(organization_id: str, user_id: str = None, limit: int = 10) -> list
    async def get_work_unit_runs(work_unit_id: str, organization_id: str, limit: int = 10) -> list
```

### ActivityService (`src/studio/services/activity_service.py`)

Aggregates activity events:

```python
class ActivityService:
    async def get_team_activity(organization_id: str, limit: int = 10) -> list
    async def get_my_activity(organization_id: str, user_id: str, limit: int = 10) -> list
    async def get_activity_summary(organization_id: str, hours: int = 24) -> dict
```

### WorkspaceService Extensions

Added member and work unit management:

```python
# Member management
async def add_member(workspace_id, user_id, role, ...) -> dict
async def update_member(workspace_id, user_id, role=None, ...) -> dict | None
async def remove_member(workspace_id, user_id) -> bool
async def get_member(workspace_id, user_id) -> dict | None
async def get_members(workspace_id, limit=50, offset=0) -> dict

# Work unit management
async def add_work_unit(workspace_id, work_unit_id, work_unit_type, added_by, ...) -> dict
async def remove_work_unit(workspace_id, work_unit_id) -> bool
async def get_work_unit(workspace_id, work_unit_id) -> dict | None
async def get_work_units(workspace_id, work_unit_type=None, limit=50, offset=0) -> dict
```

## RunService Kaizen Integration

The RunService is designed to integrate with Kaizen BaseAgent for tracking AI agent executions:

```python
from studio.services.run_service import RunService
from kaizen.core import BaseAgent

class MyWorkflowExecutor:
    def __init__(self):
        self.run_service = RunService()

    async def execute(self, work_unit_id: str, user_id: str, input_data: dict):
        # Create run record before execution
        run = await self.run_service.create_run(
            organization_id=org_id,
            work_unit_id=work_unit_id,
            work_unit_type="atomic",
            work_unit_name="My Agent",
            user_id=user_id,
            input_data=input_data,
        )

        # Mark as running
        await self.run_service.mark_running(run["id"])

        try:
            # Execute via Kaizen BaseAgent
            agent = BaseAgent.from_registry(work_unit_id)
            result = await agent.run(input_data)

            # Mark completed with output
            await self.run_service.mark_completed(
                run["id"],
                output_data=result.to_dict(),
            )
            return result

        except Exception as e:
            # Mark failed with error details
            await self.run_service.mark_failed(
                run["id"],
                error=str(e),
                error_type=type(e).__name__,
            )
            raise
```

### Run Status Lifecycle

```
pending → running → completed
                  ↘ failed
                  ↘ cancelled
```

## ActivityService Aggregation Pattern

The ActivityService transforms run records into user-friendly activity events. It aggregates data from multiple sources:

```python
# Data flow:
# 1. Query runs from database via DataFlow
# 2. Enrich with user/work-unit names
# 3. Determine event type from status
# 4. Format timestamps for display
# 5. Return structured events

async def get_team_activity(self, organization_id: str, limit: int = 10) -> list:
    # Fetch recent runs
    runs = await self._get_recent_runs(organization_id, limit)

    # Transform to activity events
    events = []
    for run in runs:
        events.append({
            "id": run["id"],
            "type": self._determine_event_type(run),  # completion, error, run
            "userId": run["user_id"],
            "userName": run.get("user_name", "Unknown"),
            "workUnitId": run["work_unit_id"],
            "workUnitName": run.get("work_unit_name", "Unknown"),
            "timestamp": run.get("completed_at") or run.get("started_at"),
            "details": self._extract_details(run),
        })

    return events
```

### Event Type Mapping

| Run Status | Event Type | Description |
|------------|------------|-------------|
| completed | completion | Successful execution |
| failed | error | Execution failed |
| running | run | Currently executing |
| pending | run | Awaiting execution |

### Activity Summary Calculation

```python
async def get_activity_summary(self, organization_id: str, hours: int = 24) -> dict:
    # Calculate time window
    since = datetime.now(UTC) - timedelta(hours=hours)

    # Count runs by status
    counts = await self._count_runs_by_status(organization_id, since)

    # Calculate success rate
    total = sum(counts.values())
    success_rate = counts["completed"] / total if total > 0 else 0.0

    return {
        "period_hours": hours,
        "total_runs": total,
        "completed": counts["completed"],
        "failed": counts["failed"],
        "pending": counts["pending"],
        "running": counts["running"],
        "success_rate": round(success_rate, 2),
    }
```

## API Endpoints

### Activity Endpoints (`/api/v1/activity`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/activity/team` | GET | Get team activity events |
| `/activity/my` | GET | Get current user's activity |
| `/activity/summary` | GET | Get activity summary statistics |

### Runs Endpoints (`/api/v1/runs`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/runs/recent` | GET | Get user's recent runs |
| `/runs/{run_id}` | GET | Get specific run details |

### Work Unit Execution (`/api/v1/work-units`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/work-units/{id}/run` | POST | Execute a work unit |
| `/work-units/{id}/runs` | GET | Get work unit run history |

### Workspace Members (`/api/v1/workspaces`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/workspaces/{id}/members` | POST | Add member to workspace |
| `/workspaces/{id}/members/{user_id}` | PATCH | Update member role |
| `/workspaces/{id}/members/{user_id}` | DELETE | Remove member |

### Workspace Work Units

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/workspaces/{id}/work-units` | POST | Add work unit to workspace |
| `/workspaces/{id}/work-units/{work_unit_id}` | DELETE | Remove work unit |

## Response Models

### ActivityEventResponse

```python
class ActivityEventResponse(BaseModel):
    id: str
    type: str              # run, delegation, error, completion
    userId: str
    userName: str
    workUnitId: str
    workUnitName: str
    timestamp: str
    details: dict | None
```

### ActivitySummaryResponse

```python
class ActivitySummaryResponse(BaseModel):
    periodHours: int
    totalRuns: int
    completed: int
    failed: int
    pending: int
    running: int
    successRate: float
```

### RunResultResponse

```python
class RunResultResponse(BaseModel):
    id: str
    status: str
    startedAt: str
    completedAt: str | None
    input: dict | None
    output: dict | None
    error: str | None
    errorType: str | None
```

## Testing

### Tier 1: Unit Tests (73 tests)

Located in `tests/unit/test_phase14_*.py`:
- Model field validation (10 tests)
- Service method behavior with mocked runtime (39 tests)
- API response model transformations (24 tests)

### Tier 2: Integration Tests (18 tests)

Located in `tests/integration/test_workspaces_api.py`:
- Workspace CRUD (10 tests)
- Workspace filtering (3 tests)
- Workspace members (3 tests)
- Workspace work units (2 tests)

Uses real PostgreSQL database with DataFlow nodes.

**Total: 91 tests passing (100% pass rate)**

### Running Tests

```bash
# Unit tests
PYTHONPATH=src pytest tests/unit/test_phase14*.py -v

# Integration tests
PYTHONPATH=src pytest tests/integration/test_activity_runs_api.py \
    tests/integration/test_workspaces_api.py \
    tests/integration/test_work_units_api.py -v
```

## Error Handling

All services gracefully handle missing tables by returning empty results:

```python
async def get_team_activity(self, organization_id: str, limit: int = 10) -> list:
    try:
        # ... DataFlow node execution
    except Exception:
        # Table might not exist yet - return empty list
        return []
```

This allows the application to function before database migrations are complete.

## DataFlow Best Practices

### Critical Rules Applied

1. **Never manually set timestamps** - DataFlow automatically manages `created_at` and `updated_at`:
   ```python
   # WRONG - causes DF-104 error
   data["updated_at"] = datetime.now().isoformat()

   # CORRECT - let DataFlow handle it
   data.pop("updated_at", None)
   ```

2. **Use empty string for nullable fields** - DataFlow uses strings, not None:
   ```python
   # WRONG
   "archived_at": None

   # CORRECT
   "archived_at": ""
   ```

3. **UpdateNode requires 'id' in filter** - Cannot use compound keys:
   ```python
   # WRONG - fails with validation error
   workflow.add_node("UpdateNode", "update", {
       "filter": {"workspace_id": ws_id, "user_id": u_id},
       "fields": {...}
   })

   # CORRECT - first get the record's id, then update
   member = await self.get_member(workspace_id, user_id)
   workflow.add_node("UpdateNode", "update", {
       "filter": {"id": member["id"]},
       "fields": {...}
   })
   ```

4. **Disable cache for immediate reads** - After writes, bypass query cache:
   ```python
   workflow.add_node("ListNode", "list", {
       "filter": {...},
       "enable_cache": False,  # Critical for consistency
   })
   ```

## Related Documentation

- [User Level Context](./01-user-level-context.md) - Frontend integration
- [Work Unit Card](./02-work-unit-card.md) - UI component for work units
- [Testing](./05-testing.md) - E2E testing strategies
- [DataFlow Guide](/.claude/skills/02-dataflow/) - Complete DataFlow reference
