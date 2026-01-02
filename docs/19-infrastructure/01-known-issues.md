# Known Infrastructure Issues

## DataFlow AsyncLocalRuntime Initialization Bug

### Status
**CRITICAL** - Blocks all async test execution

### Description
DataFlow framework calls `AsyncLocalRuntime.execute()` instead of `await runtime.execute_workflow_async()` during internal initialization (model registration, migration creation).

### Impact
- Database tables not created in async contexts
- Test suite: 583 errors, 272 failures (only 827/1682 passing)
- Blocks pytest, FastAPI, Docker async workflows

### Root Cause
**File Locations**:
- `dataflow/core/model_registry.py:159, 398` (18 locations)
- `dataflow/migrations/schema_state_manager.py:1002` (5 locations)

DataFlow detects async context correctly but then calls sync `.execute()` method, causing thread creation in async loop.

### Error Pattern
```
ERROR:dataflow.core.model_registry:Error registering model Organization:
AsyncLocalRuntime.execute() called from async context.
Use 'await runtime.execute_workflow_async(workflow, inputs)' instead.
```

### Workaround
None currently available. Application code is correct - bug is in DataFlow framework internals.

### Resolution
Requires DataFlow framework fix:

1. Add `_execute_workflow_sync()` wrapper method
2. Replace 23+ instances of `self.runtime.execute()` with wrapper
3. Wrapper detects async context and uses `asyncio.run_coroutine_threadsafe()`

**Estimated Fix Time**: 90 minutes (critical files only), 4 hours (complete fix)

**Fix Location**: DataFlow framework repository (not Kaizen Studio)

### Detailed Analysis
See `/Users/esperie/repos/dev/kailash_kaizen/.claude/improvements/studio/`:
- `BUG_REPORT_DATAFLOW_ASYNC_RUNTIME.md`
- `DATAFLOW_ASYNC_FIX_SUMMARY.md`
- `DATAFLOW_FIX_ACTION_PLAN.md`

### Impact on Project
- Cannot verify test coverage programmatically
- Manual code review required for completion verification
- Implementation is complete but unverified by automated tests
- Production deployment blocked until resolved

### Mitigation
1. Manual testing of critical paths
2. Code review of implementations
3. Integration testing in non-async environments
4. Escalate to DataFlow maintainers for framework fix

---

**Reported**: 2025-11-23
**Priority**: P0 - Blocking
**Assigned**: DataFlow framework team
**Tracking**: See improvement documents in `.claude/improvements/studio/`
