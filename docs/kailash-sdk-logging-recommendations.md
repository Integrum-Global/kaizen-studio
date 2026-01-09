# Kailash Core SDK Logging Level Recommendations

**Prepared for**: Kailash SDK Development Team
**Date**: 2026-01-08
**Kailash SDK Version**: 0.10.13
**Context**: Production Docker/FastAPI deployment with DataFlow 0.10.12

## Executive Summary

After DataFlow 0.10.12 fixed their logging levels, **61 WARNING-level messages remain** from the Kailash Core SDK during a single startup cycle. Analysis reveals these are either:
1. Informational messages that should be DEBUG/INFO
2. Expected behavior during schema operations
3. Using incorrect logger (`root` instead of named logger)

---

## Warning Analysis

### Category 1: Parameter Validation Warnings (54 occurrences)

**Current Log Messages**:
```
WARNING:kailash.workflow.builder:Parameter validation warning in node 'check_checksum':
Workflow parameters ['database_type'] not declared in get_parameters() - will be ignored by SDK
```

**Affected Nodes**:
- `check_checksum` (49 occurrences - fires on every health check)
- `create_registry_table_0` through `create_registry_table_4` (5 occurrences)

**Parameters Being Warned About**:
- `database_type`
- `validate_queries`

**Analysis**:

| Aspect | Assessment |
|--------|------------|
| **Is this an error?** | No - parameters are safely ignored |
| **Does it require action?** | No - system works correctly |
| **Is it unexpected?** | No - common when nodes don't declare all params |
| **Production impact** | Noise - 49 warnings per health check interval |

**Root Cause Options**:
1. The nodes (`check_checksum`, `create_registry_table_*`) don't declare these parameters in `get_parameters()`
2. The caller is passing extra parameters that aren't needed

**Recommendation**: Change to **DEBUG**

**Rationale**:
- WARNING implies operator action needed - none is needed here
- Parameters being ignored is informational, not problematic
- High frequency (49 per health check) creates severe log noise
- Standard practice: "parameter ignored" = DEBUG level

**Alternative Implementation** (if visibility desired):
```python
# Option A: Make it DEBUG by default
logger.debug(f"Parameter validation: {params} not declared - will be ignored")

# Option B: Make it configurable
if strict_param_validation:
    logger.warning(...)  # Only when user opts-in to strict mode
else:
    logger.debug(...)
```

**Suggested Code Change**:
```python
# In kailash/workflow/builder.py (approximate location)

# BEFORE:
logger.warning(
    f"Parameter validation warning in node '{node_id}': "
    f"Workflow parameters {undeclared_params} not declared in get_parameters() "
    "- will be ignored by SDK"
)

# AFTER:
logger.debug(
    f"Parameter validation: node '{node_id}' received undeclared parameters "
    f"{undeclared_params} - will be ignored"
)
```

---

### Category 2: DDL Safety Check Warnings (5 occurrences)

**Current Log Messages**:
```
WARNING:kailash.nodes.create_registry_table_0:Query contains potentially dangerous keyword: CREATE
WARNING:kailash.nodes.create_registry_table_1:Query contains potentially dangerous keyword: CREATE
...
```

**Analysis**:

| Aspect | Assessment |
|--------|------------|
| **Purpose** | SQL injection prevention |
| **Is CREATE dangerous?** | Only if unexpected |
| **Context here** | Node is literally named `create_registry_table` |
| **Is this a false positive?** | Yes - DDL is intentional |

**The Problem**:
The warning fires during **intentional schema operations**. A node named `create_registry_table` is obviously going to use `CREATE TABLE`. This is a false positive.

**Recommendation**: Context-aware logging

**Suggested Implementation**:
```python
# In the SQL execution layer

DDL_KEYWORDS = {'CREATE', 'DROP', 'ALTER', 'TRUNCATE'}
DDL_SAFE_NODE_PATTERNS = {
    'create_*_table',
    'drop_*_table',
    'migrate_*',
    'schema_*',
}

def check_sql_safety(query: str, node_id: str):
    detected_keywords = [kw for kw in DDL_KEYWORDS if kw in query.upper()]

    if not detected_keywords:
        return  # No DDL keywords, nothing to check

    # Check if this is an expected DDL operation
    is_ddl_node = any(
        fnmatch.fnmatch(node_id, pattern)
        for pattern in DDL_SAFE_NODE_PATTERNS
    )

    if is_ddl_node:
        # Expected DDL operation - log at DEBUG
        logger.debug(f"DDL operation in {node_id}: {detected_keywords}")
    else:
        # Unexpected DDL - this could be SQL injection!
        logger.warning(
            f"Unexpected DDL keyword in node '{node_id}': {detected_keywords}. "
            "If this is intentional, rename node to match DDL patterns."
        )
```

**Benefits**:
- No false positives during schema operations
- Still catches unexpected DDL (potential SQL injection)
- Clear guidance on how to make DDL operations "safe"

---

### Category 3: Node Registration Overwrites (2 occurrences)

**Current Log Messages**:
```
WARNING:root:Overwriting existing node registration for 'HybridSearchNode'
WARNING:root:Overwriting existing node registration for 'AggregateNode'
```

**Issues Identified**:

1. **Wrong Logger**: Using `root` logger instead of named logger
2. **Unclear Severity**: Is overwriting expected or a bug?

**Analysis**:

| Scenario | Expected? | Correct Level |
|----------|-----------|---------------|
| Module re-import during startup | Yes | DEBUG or INFO |
| Duplicate node definitions (bug) | No | WARNING or ERROR |
| Hot-reload during development | Yes | DEBUG |

**Recommendation**:
1. Use named logger: `logging.getLogger("kailash.nodes.registry")`
2. Make level context-aware OR change to INFO

**Suggested Implementation**:
```python
# In node registration code

logger = logging.getLogger("kailash.nodes.registry")

def register_node(name: str, node_class):
    if name in _node_registry:
        existing = _node_registry[name]
        if existing is node_class:
            # Same class re-registered (module re-import) - totally fine
            logger.debug(f"Node '{name}' re-registered (same class)")
        else:
            # Different class with same name - potential conflict
            logger.warning(
                f"Node '{name}' registration overwritten: "
                f"{existing.__module__}.{existing.__name__} -> "
                f"{node_class.__module__}.{node_class.__name__}"
            )
    else:
        logger.debug(f"Node '{name}' registered")

    _node_registry[name] = node_class
```

**Benefits**:
- Proper logger hierarchy (filterable by `kailash.nodes.registry`)
- Distinguishes between harmless re-registration and actual conflicts
- Provides useful info when there IS a real conflict

---

## Summary of Recommendations

| Warning | Current | Recommended | Change |
|---------|---------|-------------|--------|
| Parameter validation | WARNING | **DEBUG** | Reduce noise |
| DDL safety checks | WARNING | **Context-aware** | Eliminate false positives |
| Node registration | WARNING (root) | **INFO** + named logger | Proper logging |

**Expected Result**: 61 warnings → 0 in normal operation

---

## Implementation Checklist

### High Priority
- [ ] Change parameter validation to DEBUG in `kailash/workflow/builder.py`
- [ ] Implement context-aware DDL checking

### Medium Priority
- [ ] Change node registration logger from `root` to `kailash.nodes.registry`
- [ ] Make node registration level context-aware (same class = DEBUG, different class = WARNING)

### Optional Enhancements
- [ ] Add `strict_param_validation` option for users who want warnings
- [ ] Add structured logging support for production environments

---

## Test Environment

- **Deployment**: Docker + FastAPI + PostgreSQL
- **DataFlow**: 0.10.12 (logging fixed)
- **Kailash SDK**: 0.10.13
- **Models**: 49 DataFlow models
- **Health check interval**: Default (causes 49 `check_checksum` warnings per interval)

---

## Appendix: Full Warning List

```
# Parameter validation (54 total)
WARNING:kailash.workflow.builder:Parameter validation warning in node 'check_checksum':
  Workflow parameters ['database_type'] not declared - will be ignored (x49)

WARNING:kailash.workflow.builder:Parameter validation warning in node 'create_registry_table_N':
  Workflow parameters ['database_type', 'validate_queries'] not declared - will be ignored (x5)

# DDL safety (5 total)
WARNING:kailash.nodes.create_registry_table_N:Query contains potentially dangerous keyword: CREATE (x5)

# Node registration (2 total)
WARNING:root:Overwriting existing node registration for 'HybridSearchNode' (x1)
WARNING:root:Overwriting existing node registration for 'AggregateNode' (x1)
```

---

## Contact

For questions about this analysis, please contact the Kaizen Studio development team.
