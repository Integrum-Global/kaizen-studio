# EATP Implementation Instructions for Kailash-Kaizen Team

**Document Version**: 1.0
**Date**: January 2, 2026
**Priority**: CRITICAL - Core differentiator for enterprise adoption

---

## Executive Summary

This document provides step-by-step implementation instructions for completing the EATP (Enterprise Agent Trust Protocol) integration in kailash-kaizen. The implementation ensures that **every agent action can be traced back to the human who authorized it**.

**Reference Documentation**: All design decisions and specifications are documented in:
- `docs/plans/eatp-integration/` (9 documents, ~376KB total)

**Implementation Scope**:
- 3 new files (~430 lines)
- 4 modified files (~240 lines)
- Total: ~670 lines of changes

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Implementation Tasks](#2-implementation-tasks)
3. [Task 1: HumanOrigin and ExecutionContext](#task-1-humanorigin-and-executioncontext)
4. [Task 2: Enhanced DelegationRecord and AuditAnchor](#task-2-enhanced-delegationrecord-and-auditanchor)
5. [Task 3: PseudoAgent](#task-3-pseudoagent)
6. [Task 4: Enhanced TrustOperations](#task-4-enhanced-trustoperations)
7. [Task 5: ConstraintValidator](#task-5-constraintvalidator)
8. [Task 6: Enhanced TrustedAgent](#task-6-enhanced-trustedagent)
9. [Task 7: Database Schema Updates](#task-7-database-schema-updates)
10. [Testing Requirements](#8-testing-requirements)
11. [Acceptance Criteria](#9-acceptance-criteria)
12. [Definition of Done](#10-definition-of-done)

---

## 1. Prerequisites

### Required Reading

Before starting implementation, the team MUST read:

| Document | Why It's Essential |
|----------|-------------------|
| `02-eatp-fundamentals.md` | Understand the "why" - first principles and mental model |
| `03-current-state-analysis.md` | Know what already exists (don't reinvent) |
| `04-gap-analysis.md` | Detailed technical specifications for each gap |
| `05-architecture-design.md` | The elegant solution design with code examples |
| `08-implementation-matrix.md` | Exact file-by-file changes required |

### Development Environment

```bash
# Clone kailash-kaizen
cd ~/repos/dev/kailash_kaizen/apps/kailash-kaizen

# Ensure you're on the correct branch
git checkout -b feature/eatp-human-origin

# Install dependencies
pip install -e ".[dev]"

# Run existing tests to ensure baseline
pytest tests/trust/ -v
```

---

## 2. Implementation Tasks

### Task Overview

| Task | File(s) | Priority | Blocks |
|------|---------|----------|--------|
| 1 | `execution_context.py` (NEW) | P0 | All tasks |
| 2 | `chain.py` (MODIFY) | P0 | Tasks 3-6 |
| 3 | `pseudo_agent.py` (NEW) | P0 | Task 4 |
| 4 | `operations.py` (MODIFY) | P0 | Tasks 5-6 |
| 5 | `constraint_validator.py` (NEW) | P1 | None |
| 6 | `trusted_agent.py` (MODIFY) | P1 | None |
| 7 | Database migration | P1 | None |

**Critical Path**: Tasks 1 → 2 → 3 → 4 (must be sequential)

---

## Task 1: HumanOrigin and ExecutionContext

### Reference
- `05-architecture-design.md` → "Component Design" → "1. ExecutionContext"

### File to Create
**Path**: `src/kaizen/trust/execution_context.py`

### Specification

```python
"""
Execution context for EATP trust propagation.

This module provides the HumanOrigin and ExecutionContext classes that
enable tracing every agent action back to the human who authorized it.

Reference: docs/plans/eatp-integration/05-architecture-design.md
"""

from contextvars import ContextVar
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid


@dataclass(frozen=True)  # MUST be immutable
class HumanOrigin:
    """
    Immutable record of the human who authorized an execution chain.

    This is the MOST CRITICAL data structure in EATP.
    It MUST be present in every operation and CANNOT be modified.

    Attributes:
        human_id: Unique identifier (email or user_id from auth system)
        display_name: Human-readable name for UI display
        auth_provider: Authentication provider (okta, azure_ad, etc.)
        session_id: Session ID for correlation and revocation
        authenticated_at: When the human authenticated
    """
    human_id: str
    display_name: str
    auth_provider: str
    session_id: str
    authenticated_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary for storage."""
        return {
            "human_id": self.human_id,
            "display_name": self.display_name,
            "auth_provider": self.auth_provider,
            "session_id": self.session_id,
            "authenticated_at": self.authenticated_at.isoformat()
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HumanOrigin':
        """Deserialize from dictionary."""
        return cls(
            human_id=data["human_id"],
            display_name=data["display_name"],
            auth_provider=data["auth_provider"],
            session_id=data["session_id"],
            authenticated_at=datetime.fromisoformat(data["authenticated_at"])
        )


@dataclass
class ExecutionContext:
    """
    Context that flows through all EATP operations.

    This is the "ambient" context that every operation has access to.
    It provides the HumanOrigin and accumulated constraints.

    Attributes:
        human_origin: The human who ultimately authorized this chain
        delegation_chain: List of agent IDs from human to current agent
        delegation_depth: How deep in the delegation chain (0 = direct from human)
        constraints: Accumulated constraints (tightened through delegation)
        trace_id: Unique ID for correlating all operations in this chain
    """
    human_origin: HumanOrigin
    delegation_chain: List[str] = field(default_factory=list)
    delegation_depth: int = 0
    constraints: Dict[str, Any] = field(default_factory=dict)
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def with_delegation(
        self,
        delegatee_id: str,
        additional_constraints: Optional[Dict[str, Any]] = None
    ) -> 'ExecutionContext':
        """
        Create new context for a delegated agent.

        IMPORTANT: human_origin is PRESERVED (never changes).
        Constraints are MERGED (can only tighten).

        Args:
            delegatee_id: ID of the agent receiving delegation
            additional_constraints: New constraints to add (must be tighter)

        Returns:
            New ExecutionContext for the delegated agent
        """
        new_chain = self.delegation_chain + [delegatee_id]
        merged_constraints = {**self.constraints}
        if additional_constraints:
            merged_constraints.update(additional_constraints)

        return ExecutionContext(
            human_origin=self.human_origin,  # PRESERVED - never changes!
            delegation_chain=new_chain,
            delegation_depth=self.delegation_depth + 1,
            constraints=merged_constraints,
            trace_id=self.trace_id  # Same trace for correlation
        )


# Context variable for async-safe propagation
_execution_context: ContextVar[Optional[ExecutionContext]] = ContextVar(
    'execution_context', default=None
)


def get_current_context() -> Optional[ExecutionContext]:
    """
    Get the current execution context.

    Returns None if no context is set (indicates a bug - all operations
    should have a context).
    """
    return _execution_context.get()


def set_current_context(ctx: ExecutionContext) -> None:
    """Set the current execution context."""
    _execution_context.set(ctx)


@contextmanager
def execution_context(ctx: ExecutionContext):
    """
    Context manager for setting execution context.

    Usage:
        with execution_context(ctx):
            # All operations in this block will have access to ctx
            await agent.execute_async(...)
    """
    token = _execution_context.set(ctx)
    try:
        yield ctx
    finally:
        _execution_context.reset(token)
```

### Testing Objectives for Task 1

```python
# tests/trust/test_execution_context.py

class TestHumanOrigin:
    """Tests for HumanOrigin dataclass."""

    def test_human_origin_is_immutable(self):
        """HumanOrigin MUST be frozen - cannot be modified after creation."""
        origin = HumanOrigin(
            human_id="alice@corp.com",
            display_name="Alice Chen",
            auth_provider="okta",
            session_id="sess-123",
            authenticated_at=datetime.utcnow()
        )
        with pytest.raises(FrozenInstanceError):
            origin.human_id = "bob@corp.com"  # MUST fail

    def test_human_origin_serialization_roundtrip(self):
        """HumanOrigin MUST serialize and deserialize without data loss."""
        original = HumanOrigin(...)
        serialized = original.to_dict()
        restored = HumanOrigin.from_dict(serialized)
        assert restored == original  # MUST be equal


class TestExecutionContext:
    """Tests for ExecutionContext."""

    def test_with_delegation_preserves_human_origin(self):
        """
        CRITICAL TEST: Delegation MUST NOT modify human_origin.
        The human_origin must be the same object reference.
        """
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        ctx = ExecutionContext(human_origin=origin, delegation_chain=["pseudo:alice"])

        delegated_ctx = ctx.with_delegation("agent-a", {"cost_limit": 1000})

        # MUST be the exact same HumanOrigin
        assert delegated_ctx.human_origin is origin
        assert delegated_ctx.human_origin.human_id == "alice@corp.com"

    def test_with_delegation_extends_chain(self):
        """Delegation MUST add to the chain, not replace it."""
        ctx = ExecutionContext(
            human_origin=HumanOrigin(...),
            delegation_chain=["pseudo:alice", "manager-agent"]
        )

        delegated_ctx = ctx.with_delegation("worker-agent", {})

        assert delegated_ctx.delegation_chain == [
            "pseudo:alice",
            "manager-agent",
            "worker-agent"
        ]
        assert delegated_ctx.delegation_depth == ctx.delegation_depth + 1

    def test_with_delegation_merges_constraints(self):
        """Delegation MUST merge constraints, preserving existing ones."""
        ctx = ExecutionContext(
            human_origin=HumanOrigin(...),
            constraints={"cost_limit": 10000, "time_window": "09:00-17:00"}
        )

        delegated_ctx = ctx.with_delegation("agent-a", {"cost_limit": 1000})

        # New constraint overrides
        assert delegated_ctx.constraints["cost_limit"] == 1000
        # Original constraint preserved
        assert delegated_ctx.constraints["time_window"] == "09:00-17:00"


class TestContextVariable:
    """Tests for context variable propagation."""

    @pytest.mark.asyncio
    async def test_context_propagates_through_async_calls(self):
        """ExecutionContext MUST be accessible in nested async calls."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        ctx = ExecutionContext(human_origin=origin)

        async def inner_function():
            current = get_current_context()
            assert current is not None
            assert current.human_origin.human_id == "alice@corp.com"

        with execution_context(ctx):
            await inner_function()

    def test_context_isolation_between_threads(self):
        """Each async task MUST have isolated context."""
        # Test that concurrent tasks don't interfere with each other's context
        pass
```

### Acceptance Criteria for Task 1

- [ ] `HumanOrigin` is a frozen (immutable) dataclass
- [ ] `HumanOrigin.to_dict()` and `from_dict()` round-trip without data loss
- [ ] `ExecutionContext.with_delegation()` preserves `human_origin` identity
- [ ] `ExecutionContext.with_delegation()` extends `delegation_chain`
- [ ] `get_current_context()` returns context set by `execution_context()`
- [ ] Context propagates correctly through async/await calls
- [ ] All tests pass with 100% coverage of new code

---

## Task 2: Enhanced DelegationRecord and AuditAnchor

### Reference
- `04-gap-analysis.md` → "G1: root_source Tracing"
- `05-architecture-design.md` → "2. Enhanced Trust Lineage Chain"

### File to Modify
**Path**: `src/kaizen/trust/chain.py`

### Changes Required

Add import at top:
```python
from kaizen.trust.execution_context import HumanOrigin
```

Modify `DelegationRecord` dataclass:

```python
@dataclass
class DelegationRecord:
    """
    Record of trust delegation from one agent to another.

    EATP Enhancement: Now includes human_origin to trace back to
    the human who ultimately authorized this delegation chain.
    """
    delegator_id: str
    delegatee_id: str
    task_id: str
    delegated_capabilities: List[str]
    delegated_at: datetime
    expires_at: Optional[datetime] = None
    constraints: Dict[str, Any] = field(default_factory=dict)

    # NEW FIELDS - EATP human origin tracing
    human_origin: Optional[HumanOrigin] = None  # Who ultimately authorized
    delegation_chain: List[str] = field(default_factory=list)  # Full path from human
    delegation_depth: int = 0  # Distance from human (0 = direct)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize including new fields."""
        d = {
            "delegator_id": self.delegator_id,
            "delegatee_id": self.delegatee_id,
            "task_id": self.task_id,
            "delegated_capabilities": self.delegated_capabilities,
            "delegated_at": self.delegated_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "constraints": self.constraints,
            # NEW: Include human origin
            "delegation_chain": self.delegation_chain,
            "delegation_depth": self.delegation_depth,
        }
        if self.human_origin:
            d["human_origin"] = self.human_origin.to_dict()
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DelegationRecord':
        """Deserialize including new fields."""
        human_origin = None
        if data.get("human_origin"):
            human_origin = HumanOrigin.from_dict(data["human_origin"])

        return cls(
            delegator_id=data["delegator_id"],
            delegatee_id=data["delegatee_id"],
            task_id=data["task_id"],
            delegated_capabilities=data["delegated_capabilities"],
            delegated_at=datetime.fromisoformat(data["delegated_at"]),
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
            constraints=data.get("constraints", {}),
            # NEW fields
            human_origin=human_origin,
            delegation_chain=data.get("delegation_chain", []),
            delegation_depth=data.get("delegation_depth", 0),
        )
```

Modify `AuditAnchor` dataclass:

```python
@dataclass
class AuditAnchor:
    """
    Immutable audit record of an agent action.

    EATP Enhancement: Now includes human_origin for complete traceability.
    Every audit record can answer "which human authorized this action?"
    """
    anchor_id: str
    agent_id: str
    action: str
    resource: str
    result: ActionResult
    timestamp: datetime
    context: Dict[str, Any]
    parent_anchor_id: Optional[str] = None

    # NEW FIELD - EATP human origin
    human_origin: Optional[HumanOrigin] = None  # Who ultimately authorized

    def to_dict(self) -> Dict[str, Any]:
        d = {
            "anchor_id": self.anchor_id,
            "agent_id": self.agent_id,
            "action": self.action,
            "resource": self.resource,
            "result": self.result.value,
            "timestamp": self.timestamp.isoformat(),
            "context": self.context,
            "parent_anchor_id": self.parent_anchor_id,
        }
        if self.human_origin:
            d["human_origin"] = self.human_origin.to_dict()
        return d
```

### Testing Objectives for Task 2

```python
# tests/trust/test_chain_eatp.py

class TestDelegationRecordEATP:
    """Tests for EATP enhancements to DelegationRecord."""

    def test_delegation_record_includes_human_origin(self):
        """DelegationRecord MUST accept and store human_origin."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        record = DelegationRecord(
            delegator_id="pseudo:alice",
            delegatee_id="agent-a",
            task_id="task-1",
            delegated_capabilities=["read"],
            delegated_at=datetime.utcnow(),
            human_origin=origin,
            delegation_chain=["pseudo:alice", "agent-a"],
            delegation_depth=1
        )
        assert record.human_origin.human_id == "alice@corp.com"
        assert record.delegation_depth == 1

    def test_delegation_record_serialization_with_human_origin(self):
        """Serialization MUST preserve human_origin."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        record = DelegationRecord(..., human_origin=origin)

        serialized = record.to_dict()
        restored = DelegationRecord.from_dict(serialized)

        assert restored.human_origin.human_id == "alice@corp.com"

    def test_delegation_record_backward_compatible(self):
        """Records without human_origin (legacy) MUST still work."""
        legacy_data = {
            "delegator_id": "agent-a",
            "delegatee_id": "agent-b",
            # ... no human_origin field
        }
        record = DelegationRecord.from_dict(legacy_data)
        assert record.human_origin is None  # Graceful handling


class TestAuditAnchorEATP:
    """Tests for EATP enhancements to AuditAnchor."""

    def test_audit_anchor_includes_human_origin(self):
        """AuditAnchor MUST store human_origin for traceability."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        anchor = AuditAnchor(
            anchor_id="audit-1",
            agent_id="agent-a",
            action="read_invoice",
            resource="invoices/123",
            result=ActionResult.SUCCESS,
            timestamp=datetime.utcnow(),
            context={},
            human_origin=origin
        )
        assert anchor.human_origin.human_id == "alice@corp.com"
```

### Acceptance Criteria for Task 2

- [ ] `DelegationRecord` has `human_origin`, `delegation_chain`, `delegation_depth` fields
- [ ] `AuditAnchor` has `human_origin` field
- [ ] All new fields are Optional with sensible defaults (backward compatible)
- [ ] Serialization/deserialization preserves new fields
- [ ] Legacy records (without new fields) deserialize without errors
- [ ] All existing tests still pass
- [ ] New tests achieve 100% coverage of changes

---

## Task 3: PseudoAgent

### Reference
- `04-gap-analysis.md` → "G2: PseudoAgent"
- `05-architecture-design.md` → "3. PseudoAgent (Human Facade)"

### File to Create
**Path**: `src/kaizen/trust/pseudo_agent.py`

### Specification

```python
"""
PseudoAgent - Human facade for the EATP system.

PseudoAgents are the ONLY entities that can initiate trust chains.
They bridge human authentication to the agentic world.

Reference: docs/plans/eatp-integration/04-gap-analysis.md (G2: PseudoAgent)
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum

from kaizen.trust.execution_context import HumanOrigin, ExecutionContext
from kaizen.trust.chain import DelegationRecord


class AuthProvider(str, Enum):
    """Supported authentication providers."""
    OKTA = "okta"
    AZURE_AD = "azure_ad"
    GOOGLE = "google"
    SAML = "saml"
    OIDC = "oidc"
    LDAP = "ldap"
    SESSION = "session"  # For testing/internal use
    CUSTOM = "custom"


class PseudoAgent:
    """
    Human facade in the EATP system.

    PseudoAgents are the ONLY entities that can be the root_source
    of a delegation chain. They bridge human authentication to EATP.

    Key Properties:
    - Cannot be delegated TO (only FROM)
    - Always the root of trust chains
    - Tied to a specific human identity
    - Session-scoped (should be invalidated when human logs out)

    Usage:
        # Create from authenticated session
        pseudo = PseudoAgent(
            human_origin=HumanOrigin(
                human_id="alice@corp.com",
                display_name="Alice Chen",
                auth_provider="okta",
                session_id="sess-123",
                authenticated_at=datetime.utcnow()
            ),
            trust_operations=trust_ops
        )

        # Delegate to an agent
        delegation, ctx = await pseudo.delegate_to(
            agent_id="invoice-processor",
            task_id="november-invoices",
            capabilities=["read_invoices", "process_invoices"],
            constraints={"cost_limit": 1000}
        )

        # The agent can now execute with the context
        await agent.execute_async(inputs, context=ctx)
    """

    def __init__(
        self,
        human_origin: HumanOrigin,
        trust_operations: 'TrustOperations',
        default_constraints: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize PseudoAgent.

        Args:
            human_origin: Verified human identity
            trust_operations: TrustOperations instance for delegation
            default_constraints: Default constraints for all delegations
        """
        self._origin = human_origin
        self._trust_ops = trust_operations
        self._default_constraints = default_constraints or {}

        # Generate pseudo-agent ID from human identity
        self._pseudo_id = f"pseudo:{human_origin.human_id}"

    @property
    def agent_id(self) -> str:
        """The pseudo-agent's ID (used in delegation chains)."""
        return self._pseudo_id

    @property
    def human_origin(self) -> HumanOrigin:
        """The human identity this pseudo-agent represents."""
        return self._origin

    def create_execution_context(
        self,
        initial_constraints: Optional[Dict[str, Any]] = None
    ) -> ExecutionContext:
        """
        Create an ExecutionContext rooted in this human.

        This is how ALL execution chains MUST start - from a PseudoAgent.

        Args:
            initial_constraints: Constraints for this execution

        Returns:
            ExecutionContext with this human as root_source
        """
        constraints = {**self._default_constraints}
        if initial_constraints:
            constraints.update(initial_constraints)

        return ExecutionContext(
            human_origin=self._origin,
            delegation_chain=[self._pseudo_id],
            delegation_depth=0,
            constraints=constraints
        )

    async def delegate_to(
        self,
        agent_id: str,
        task_id: str,
        capabilities: List[str],
        constraints: Optional[Dict[str, Any]] = None,
        expires_at: Optional[datetime] = None
    ) -> Tuple[DelegationRecord, ExecutionContext]:
        """
        Delegate trust from human to an agent.

        This is the ONLY way trust enters the agentic system.
        The returned ExecutionContext has this human as root_source.

        Args:
            agent_id: ID of the agent to delegate to
            task_id: ID of the task being delegated
            capabilities: Capabilities to grant
            constraints: Constraints to apply
            expires_at: When this delegation expires

        Returns:
            Tuple of (DelegationRecord, ExecutionContext for the agent)
        """
        # Create initial context from this human
        ctx = self.create_execution_context(constraints)

        # Create delegation record
        delegation = await self._trust_ops.delegate(
            delegator_id=self._pseudo_id,
            delegatee_id=agent_id,
            task_id=task_id,
            capabilities=capabilities,
            additional_constraints=constraints or {},
            expires_at=expires_at,
            context=ctx
        )

        # Create context for the delegated agent
        agent_ctx = ctx.with_delegation(agent_id, constraints)

        return delegation, agent_ctx


class PseudoAgentFactory:
    """
    Factory for creating PseudoAgents from various auth sources.

    This is the single entry point for creating PseudoAgents.
    It handles validation and normalization of identity data.
    """

    def __init__(self, trust_operations: 'TrustOperations'):
        self._trust_ops = trust_operations

    def from_session(
        self,
        user_id: str,
        email: str,
        display_name: str,
        session_id: str,
        auth_provider: str = "session"
    ) -> PseudoAgent:
        """
        Create PseudoAgent from session data.

        Use this when you have already validated the user's identity
        and have session information.

        Args:
            user_id: Unique user identifier
            email: User's email (used as human_id)
            display_name: Human-readable name
            session_id: Current session ID
            auth_provider: How the user authenticated

        Returns:
            PseudoAgent representing this human
        """
        origin = HumanOrigin(
            human_id=email,  # Use email as canonical ID
            display_name=display_name,
            auth_provider=auth_provider,
            session_id=session_id,
            authenticated_at=datetime.utcnow()
        )
        return PseudoAgent(origin, self._trust_ops)

    def from_claims(
        self,
        claims: Dict[str, Any],
        auth_provider: str
    ) -> PseudoAgent:
        """
        Create PseudoAgent from JWT claims or similar.

        Args:
            claims: Dictionary of identity claims
            auth_provider: The auth provider (okta, azure_ad, etc.)

        Returns:
            PseudoAgent representing this human
        """
        origin = HumanOrigin(
            human_id=claims.get("email") or claims.get("sub"),
            display_name=claims.get("name") or claims.get("email") or claims.get("sub"),
            auth_provider=auth_provider,
            session_id=claims.get("jti") or claims.get("session_id") or str(uuid.uuid4()),
            authenticated_at=datetime.fromtimestamp(claims.get("iat", datetime.utcnow().timestamp()))
        )
        return PseudoAgent(origin, self._trust_ops)
```

### Testing Objectives for Task 3

```python
# tests/trust/test_pseudo_agent.py

class TestPseudoAgent:
    """Tests for PseudoAgent."""

    def test_pseudo_agent_id_format(self):
        """PseudoAgent ID MUST have 'pseudo:' prefix."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        pseudo = PseudoAgent(origin, mock_trust_ops)

        assert pseudo.agent_id == "pseudo:alice@corp.com"

    def test_create_execution_context_sets_human_origin(self):
        """ExecutionContext MUST have correct human_origin."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        pseudo = PseudoAgent(origin, mock_trust_ops)

        ctx = pseudo.create_execution_context()

        assert ctx.human_origin is origin
        assert ctx.human_origin.human_id == "alice@corp.com"

    def test_create_execution_context_starts_chain(self):
        """ExecutionContext MUST start delegation chain with pseudo-agent."""
        pseudo = PseudoAgent(origin, mock_trust_ops)
        ctx = pseudo.create_execution_context()

        assert ctx.delegation_chain == ["pseudo:alice@corp.com"]
        assert ctx.delegation_depth == 0

    @pytest.mark.asyncio
    async def test_delegate_to_creates_correct_delegation(self):
        """delegate_to MUST create delegation with human_origin."""
        pseudo = PseudoAgent(origin, trust_ops)

        delegation, ctx = await pseudo.delegate_to(
            agent_id="agent-a",
            task_id="task-1",
            capabilities=["read"],
            constraints={"cost_limit": 1000}
        )

        # Delegation record must have human_origin
        assert delegation.human_origin.human_id == "alice@corp.com"
        assert delegation.delegation_chain == ["pseudo:alice@corp.com", "agent-a"]

        # Context for agent must be correct
        assert ctx.human_origin.human_id == "alice@corp.com"
        assert ctx.delegation_depth == 1

    @pytest.mark.asyncio
    async def test_delegate_to_applies_constraints(self):
        """Delegation MUST apply specified constraints."""
        pseudo = PseudoAgent(origin, trust_ops, default_constraints={"time_window": "09:00-17:00"})

        delegation, ctx = await pseudo.delegate_to(
            agent_id="agent-a",
            task_id="task-1",
            capabilities=["read"],
            constraints={"cost_limit": 1000}
        )

        # Both default and specified constraints
        assert ctx.constraints["time_window"] == "09:00-17:00"
        assert ctx.constraints["cost_limit"] == 1000


class TestPseudoAgentFactory:
    """Tests for PseudoAgentFactory."""

    def test_from_session_creates_valid_pseudo_agent(self):
        """Factory MUST create valid PseudoAgent from session data."""
        factory = PseudoAgentFactory(mock_trust_ops)

        pseudo = factory.from_session(
            user_id="user-123",
            email="alice@corp.com",
            display_name="Alice Chen",
            session_id="sess-456",
            auth_provider="okta"
        )

        assert pseudo.human_origin.human_id == "alice@corp.com"
        assert pseudo.human_origin.display_name == "Alice Chen"
        assert pseudo.human_origin.auth_provider == "okta"

    def test_from_claims_handles_various_claim_formats(self):
        """Factory MUST handle different JWT claim formats."""
        factory = PseudoAgentFactory(mock_trust_ops)

        # Standard OIDC claims
        pseudo1 = factory.from_claims(
            {"sub": "user-123", "email": "alice@corp.com", "name": "Alice"},
            "okta"
        )
        assert pseudo1.human_origin.human_id == "alice@corp.com"

        # Minimal claims
        pseudo2 = factory.from_claims(
            {"sub": "user-123"},
            "custom"
        )
        assert pseudo2.human_origin.human_id == "user-123"
```

### Acceptance Criteria for Task 3

- [ ] `PseudoAgent.agent_id` returns `pseudo:{human_id}` format
- [ ] `PseudoAgent.create_execution_context()` sets correct `human_origin`
- [ ] `PseudoAgent.delegate_to()` creates delegation with `human_origin`
- [ ] `PseudoAgentFactory.from_session()` works correctly
- [ ] `PseudoAgentFactory.from_claims()` handles various claim formats
- [ ] All tests pass with 100% coverage

---

## Task 4: Enhanced TrustOperations

### Reference
- `04-gap-analysis.md` → "G1: root_source Tracing", "G3: Cascade Revocation"
- `05-architecture-design.md` → "4. Enhanced TrustOperations"

### File to Modify
**Path**: `src/kaizen/trust/operations.py`

### Changes Required

Add imports:
```python
from kaizen.trust.execution_context import (
    HumanOrigin,
    ExecutionContext,
    get_current_context
)
```

Modify `delegate()` method:

```python
async def delegate(
    self,
    delegator_id: str,
    delegatee_id: str,
    task_id: str,
    capabilities: List[str],
    additional_constraints: Dict[str, Any],
    expires_at: Optional[datetime] = None,
    context: Optional[ExecutionContext] = None  # NEW PARAMETER
) -> DelegationRecord:
    """
    DELEGATE operation - Transfer trust with constraint tightening.

    EATP Enhancement: Now accepts and propagates ExecutionContext.
    The human_origin from the context is stored in the delegation record.

    Args:
        delegator_id: ID of the delegating agent
        delegatee_id: ID of the agent receiving delegation
        task_id: ID of the task being delegated
        capabilities: Capabilities to delegate
        additional_constraints: Constraints to add (must be tighter)
        expires_at: When this delegation expires
        context: ExecutionContext with human_origin (REQUIRED for new delegations)

    Returns:
        DelegationRecord with human_origin set

    Raises:
        TrustError: If no context provided and none in context variable
        ConstraintViolationError: If constraints would be loosened
    """
    # Get context from parameter or context variable
    ctx = context or get_current_context()

    # For new delegations, context is required
    # (Legacy code paths may not have context - handle gracefully)
    human_origin = None
    delegation_chain = []
    delegation_depth = 0

    if ctx:
        human_origin = ctx.human_origin
        delegation_chain = ctx.delegation_chain + [delegatee_id]
        delegation_depth = ctx.delegation_depth + 1

        # Validate constraint tightening if validator available
        if hasattr(self, '_constraint_validator') and self._constraint_validator:
            validation = self._constraint_validator.validate_tightening(
                parent_constraints=ctx.constraints,
                child_constraints=additional_constraints
            )
            if not validation.valid:
                raise ConstraintViolationError(
                    f"Constraint tightening violation: {validation.violations}"
                )

    # Merge constraints
    merged_constraints = {}
    if ctx:
        merged_constraints = {**ctx.constraints}
    merged_constraints.update(additional_constraints)

    # Create delegation record with EATP fields
    delegation = DelegationRecord(
        delegator_id=delegator_id,
        delegatee_id=delegatee_id,
        task_id=task_id,
        delegated_capabilities=capabilities,
        delegated_at=datetime.utcnow(),
        expires_at=expires_at,
        constraints=merged_constraints,
        # NEW EATP fields
        human_origin=human_origin,
        delegation_chain=delegation_chain,
        delegation_depth=delegation_depth
    )

    # Store delegation
    await self._store.save_delegation(delegation)

    logger.info(
        f"Delegation created: {delegator_id} -> {delegatee_id} "
        f"(human_origin: {human_origin.human_id if human_origin else 'N/A'})"
    )

    return delegation
```

Modify `audit()` method:

```python
async def audit(
    self,
    agent_id: str,
    action: str,
    resource: str,
    result: ActionResult,
    context_data: Dict[str, Any],
    parent_anchor_id: Optional[str] = None,
    context: Optional[ExecutionContext] = None  # NEW PARAMETER
) -> AuditAnchor:
    """
    AUDIT operation - Record immutable action trail.

    EATP Enhancement: Now includes human_origin in audit records.
    Every audit record can answer "which human authorized this action?"
    """
    ctx = context or get_current_context()

    anchor = AuditAnchor(
        anchor_id=str(uuid.uuid4()),
        agent_id=agent_id,
        action=action,
        resource=resource,
        result=result,
        timestamp=datetime.utcnow(),
        context=context_data,
        parent_anchor_id=parent_anchor_id,
        # NEW: Include human origin
        human_origin=ctx.human_origin if ctx else None
    )

    await self._audit_store.save_anchor(anchor)

    logger.info(
        f"Audit anchor created: {agent_id} -> {action} on {resource} "
        f"(human_origin: {anchor.human_origin.human_id if anchor.human_origin else 'N/A'})"
    )

    return anchor
```

Add cascade revocation methods:

```python
async def revoke_cascade(
    self,
    agent_id: str,
    reason: str
) -> List[str]:
    """
    Revoke trust for an agent and CASCADE to all delegated agents.

    EATP Requirement: When trust is revoked, ALL downstream delegations
    must be immediately invalidated.

    Args:
        agent_id: ID of the agent to revoke
        reason: Reason for revocation

    Returns:
        List of all agent IDs that were revoked
    """
    revoked_agents = []

    # Revoke this agent
    await self._store.revoke_agent(agent_id, reason, datetime.utcnow())
    revoked_agents.append(agent_id)

    # Find all delegations FROM this agent
    delegations = await self._store.find_delegations_from(agent_id)

    # Recursively revoke (in parallel for performance)
    if delegations:
        cascade_tasks = [
            self.revoke_cascade(d.delegatee_id, f"Cascade from {agent_id}: {reason}")
            for d in delegations
        ]
        results = await asyncio.gather(*cascade_tasks)
        for result in results:
            revoked_agents.extend(result)

    return revoked_agents


async def revoke_by_human(
    self,
    human_id: str,
    reason: str
) -> List[str]:
    """
    Revoke ALL delegations from a specific human.

    EATP Requirement: When a human's access is revoked (e.g., employee
    leaves company), ALL agents they delegated to must be revoked.

    Args:
        human_id: The human_id (email) to revoke
        reason: Reason for revocation

    Returns:
        List of all agent IDs that were revoked
    """
    # Find all delegations where human_origin.human_id matches
    delegations = await self._store.find_delegations_by_human_origin(human_id)

    revoked_agents = []
    for delegation in delegations:
        result = await self.revoke_cascade(
            delegation.delegatee_id,
            f"Human access revoked ({human_id}): {reason}"
        )
        revoked_agents.extend(result)

    logger.warning(
        f"Revoked all delegations from human {human_id}: "
        f"{len(revoked_agents)} agents affected. Reason: {reason}"
    )

    return revoked_agents
```

### Testing Objectives for Task 4

```python
# tests/trust/test_operations_eatp.py

class TestDelegateWithContext:
    """Tests for EATP-enhanced delegate()."""

    @pytest.mark.asyncio
    async def test_delegate_stores_human_origin(self):
        """Delegation MUST store human_origin from context."""
        origin = HumanOrigin(human_id="alice@corp.com", ...)
        ctx = ExecutionContext(
            human_origin=origin,
            delegation_chain=["pseudo:alice"]
        )

        delegation = await trust_ops.delegate(
            delegator_id="pseudo:alice",
            delegatee_id="agent-a",
            task_id="task-1",
            capabilities=["read"],
            additional_constraints={},
            context=ctx
        )

        assert delegation.human_origin.human_id == "alice@corp.com"

    @pytest.mark.asyncio
    async def test_delegate_extends_delegation_chain(self):
        """Delegation MUST extend the delegation chain."""
        ctx = ExecutionContext(
            human_origin=origin,
            delegation_chain=["pseudo:alice", "manager-agent"],
            delegation_depth=1
        )

        delegation = await trust_ops.delegate(
            delegator_id="manager-agent",
            delegatee_id="worker-agent",
            task_id="task-1",
            capabilities=["read"],
            additional_constraints={},
            context=ctx
        )

        assert delegation.delegation_chain == [
            "pseudo:alice", "manager-agent", "worker-agent"
        ]
        assert delegation.delegation_depth == 2

    @pytest.mark.asyncio
    async def test_delegate_without_context_is_backward_compatible(self):
        """Delegation without context MUST work (for legacy code)."""
        delegation = await trust_ops.delegate(
            delegator_id="agent-a",
            delegatee_id="agent-b",
            task_id="task-1",
            capabilities=["read"],
            additional_constraints={}
            # No context parameter
        )

        # Should succeed but without human_origin
        assert delegation.human_origin is None


class TestAuditWithContext:
    """Tests for EATP-enhanced audit()."""

    @pytest.mark.asyncio
    async def test_audit_includes_human_origin(self):
        """Audit anchor MUST include human_origin."""
        ctx = ExecutionContext(human_origin=origin, ...)

        anchor = await trust_ops.audit(
            agent_id="agent-a",
            action="read_invoice",
            resource="invoices/123",
            result=ActionResult.SUCCESS,
            context_data={},
            context=ctx
        )

        assert anchor.human_origin.human_id == "alice@corp.com"


class TestCascadeRevocation:
    """Tests for cascade revocation."""

    @pytest.mark.asyncio
    async def test_revoke_cascade_revokes_all_downstream(self):
        """
        CRITICAL TEST: Cascade revocation MUST revoke ALL downstream agents.

        Setup:
          Alice -> Agent A -> Agent B
                           -> Agent C
                -> Agent D

        Revoking Agent A should revoke A, B, C (but not D)
        """
        # Setup delegation chain
        await setup_delegation_chain(...)

        revoked = await trust_ops.revoke_cascade("agent-a", "test")

        assert "agent-a" in revoked
        assert "agent-b" in revoked
        assert "agent-c" in revoked
        assert "agent-d" not in revoked  # Different branch

    @pytest.mark.asyncio
    async def test_revoke_by_human_revokes_all_from_human(self):
        """
        CRITICAL TEST: Revoking human MUST revoke ALL their delegations.

        Setup:
          Alice -> Agent A -> Agent B
                -> Agent C
          Bob   -> Agent D

        Revoking Alice should revoke A, B, C (but not D)
        """
        revoked = await trust_ops.revoke_by_human("alice@corp.com", "left company")

        assert "agent-a" in revoked
        assert "agent-b" in revoked
        assert "agent-c" in revoked
        assert "agent-d" not in revoked  # Different human

    @pytest.mark.asyncio
    async def test_cascade_revocation_is_fast(self):
        """Cascade revocation MUST complete within SLA (<1 second for 100 agents)."""
        # Setup 100 agents in a chain
        await setup_large_delegation_chain(100)

        start = time.time()
        revoked = await trust_ops.revoke_cascade("root-agent", "test")
        elapsed = time.time() - start

        assert len(revoked) == 100
        assert elapsed < 1.0  # Must be under 1 second
```

### Acceptance Criteria for Task 4

- [ ] `delegate()` accepts `context` parameter
- [ ] `delegate()` stores `human_origin` in `DelegationRecord`
- [ ] `delegate()` extends `delegation_chain` correctly
- [ ] `audit()` stores `human_origin` in `AuditAnchor`
- [ ] `revoke_cascade()` revokes all downstream agents
- [ ] `revoke_by_human()` finds and revokes all delegations from human
- [ ] Cascade revocation completes in <1 second for 100 agents
- [ ] Backward compatibility: operations without context still work
- [ ] All tests pass with 100% coverage

---

## Task 5: ConstraintValidator

### Reference
- `04-gap-analysis.md` → "G4: Formal Constraint Tightening Validation"

### File to Create
**Path**: `src/kaizen/trust/constraint_validator.py`

### Specification

```python
"""
Constraint validation for EATP delegations.

Ensures that delegations can only TIGHTEN constraints, never loosen them.

Reference: docs/plans/eatp-integration/04-gap-analysis.md (G4)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, List, Tuple
import fnmatch


class ConstraintViolation(str, Enum):
    """Types of constraint violations."""
    COST_LOOSENED = "cost_limit_increased"
    TIME_WINDOW_EXPANDED = "time_window_expanded"
    RESOURCES_EXPANDED = "resources_expanded"
    RATE_LIMIT_INCREASED = "rate_limit_increased"
    GEO_RESTRICTION_REMOVED = "geo_restriction_removed"


@dataclass
class ValidationResult:
    """Result of constraint validation."""
    valid: bool
    violations: List[ConstraintViolation] = field(default_factory=list)
    details: Dict[str, str] = field(default_factory=dict)


class ConstraintValidator:
    """
    Validates that child constraints are strictly tighter than parent.

    Rule: A delegation can only REMOVE permissions, never ADD them.

    Supported constraints:
    - cost_limit: Child must be <= parent
    - time_window: Child must be subset of parent
    - resources: Child must be subset of parent (glob matching)
    - rate_limit: Child must be <= parent
    - geo_restrictions: Child must be subset of parent
    """

    def validate_tightening(
        self,
        parent_constraints: Dict[str, Any],
        child_constraints: Dict[str, Any]
    ) -> ValidationResult:
        """
        Validate that child constraints are subset of parent.

        Args:
            parent_constraints: Constraints of the delegator
            child_constraints: Constraints for the delegatee

        Returns:
            ValidationResult with any violations found
        """
        violations = []
        details = {}

        # Check cost limit
        if "cost_limit" in child_constraints:
            parent_limit = parent_constraints.get("cost_limit", float("inf"))
            child_limit = child_constraints["cost_limit"]
            if child_limit > parent_limit:
                violations.append(ConstraintViolation.COST_LOOSENED)
                details["cost_limit"] = f"Child {child_limit} > Parent {parent_limit}"

        # Check time window
        if "time_window" in child_constraints:
            parent_window = parent_constraints.get("time_window")
            if parent_window and not self._is_time_subset(
                parent_window, child_constraints["time_window"]
            ):
                violations.append(ConstraintViolation.TIME_WINDOW_EXPANDED)
                details["time_window"] = "Child window not within parent window"

        # Check resources
        if "resources" in child_constraints:
            parent_resources = parent_constraints.get("resources", [])
            if parent_resources and not self._is_resource_subset(
                parent_resources, child_constraints["resources"]
            ):
                violations.append(ConstraintViolation.RESOURCES_EXPANDED)
                details["resources"] = "Child resources not subset of parent"

        # Check rate limit
        if "rate_limit" in child_constraints:
            parent_rate = parent_constraints.get("rate_limit", float("inf"))
            child_rate = child_constraints["rate_limit"]
            if child_rate > parent_rate:
                violations.append(ConstraintViolation.RATE_LIMIT_INCREASED)
                details["rate_limit"] = f"Child {child_rate} > Parent {parent_rate}"

        # Check geo restrictions
        if "geo_restrictions" in parent_constraints:
            parent_geo = set(parent_constraints["geo_restrictions"])
            child_geo = set(child_constraints.get("geo_restrictions", []))
            if child_geo and not child_geo.issubset(parent_geo):
                violations.append(ConstraintViolation.GEO_RESTRICTION_REMOVED)
                details["geo_restrictions"] = "Child geo not subset of parent"

        return ValidationResult(
            valid=len(violations) == 0,
            violations=violations,
            details=details
        )

    def _is_time_subset(self, parent_window: str, child_window: str) -> bool:
        """Check if child time window is within parent."""
        try:
            p_start, p_end = self._parse_time_window(parent_window)
            c_start, c_end = self._parse_time_window(child_window)
            return c_start >= p_start and c_end <= p_end
        except Exception:
            return False  # Invalid format = not a subset

    def _is_resource_subset(
        self, parent_resources: List[str], child_resources: List[str]
    ) -> bool:
        """Check if child resources are subset of parent (with glob matching)."""
        for child_res in child_resources:
            if not any(self._glob_match(parent, child_res) for parent in parent_resources):
                return False
        return True

    def _glob_match(self, pattern: str, path: str) -> bool:
        """Check if path matches glob pattern."""
        return fnmatch.fnmatch(path, pattern)

    def _parse_time_window(self, window: str) -> Tuple[int, int]:
        """Parse time window 'HH:MM-HH:MM' to minutes from midnight."""
        start, end = window.split("-")
        return self._time_to_minutes(start.strip()), self._time_to_minutes(end.strip())

    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes from midnight."""
        h, m = map(int, time_str.split(":"))
        return h * 60 + m
```

### Testing Objectives for Task 5

```python
# tests/trust/test_constraint_validator.py

class TestConstraintValidator:
    """Tests for ConstraintValidator."""

    def test_cost_limit_tightening_allowed(self):
        """Reducing cost limit MUST be allowed."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"cost_limit": 10000},
            child_constraints={"cost_limit": 1000}
        )
        assert result.valid is True
        assert len(result.violations) == 0

    def test_cost_limit_loosening_rejected(self):
        """Increasing cost limit MUST be rejected."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"cost_limit": 1000},
            child_constraints={"cost_limit": 10000}  # LOOSENED
        )
        assert result.valid is False
        assert ConstraintViolation.COST_LOOSENED in result.violations

    def test_time_window_tightening_allowed(self):
        """Narrower time window MUST be allowed."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"time_window": "09:00-17:00"},
            child_constraints={"time_window": "10:00-16:00"}
        )
        assert result.valid is True

    def test_time_window_expansion_rejected(self):
        """Wider time window MUST be rejected."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"time_window": "10:00-16:00"},
            child_constraints={"time_window": "09:00-17:00"}  # EXPANDED
        )
        assert result.valid is False
        assert ConstraintViolation.TIME_WINDOW_EXPANDED in result.violations

    def test_resource_subset_allowed(self):
        """Resource subset MUST be allowed."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"resources": ["invoices/*"]},
            child_constraints={"resources": ["invoices/small/*"]}
        )
        assert result.valid is True

    def test_resource_expansion_rejected(self):
        """Resource expansion MUST be rejected."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={"resources": ["invoices/small/*"]},
            child_constraints={"resources": ["invoices/*"]}  # EXPANDED
        )
        assert result.valid is False

    def test_multiple_violations_reported(self):
        """All violations MUST be reported, not just first."""
        validator = ConstraintValidator()
        result = validator.validate_tightening(
            parent_constraints={
                "cost_limit": 1000,
                "time_window": "10:00-16:00"
            },
            child_constraints={
                "cost_limit": 10000,  # Violation 1
                "time_window": "09:00-17:00"  # Violation 2
            }
        )
        assert result.valid is False
        assert len(result.violations) == 2
```

### Acceptance Criteria for Task 5

- [ ] Cost limit tightening (reduction) allowed
- [ ] Cost limit loosening (increase) rejected
- [ ] Time window tightening (narrowing) allowed
- [ ] Time window loosening (expansion) rejected
- [ ] Resource subset allowed (with glob matching)
- [ ] Resource expansion rejected
- [ ] Rate limit tightening allowed
- [ ] Rate limit loosening rejected
- [ ] Geo restriction subset allowed
- [ ] Geo restriction expansion rejected
- [ ] All violations reported (not just first)
- [ ] Detailed error messages for each violation

---

## Task 6: Enhanced TrustedAgent

### Reference
- `05-architecture-design.md` → "5. Enhanced TrustedAgent"
- `07-data-flows.md` → "Data Flow 3: Trust Sandwich"

### File to Modify
**Path**: `src/kaizen/trust/trusted_agent.py`

### Changes Required

Add imports:
```python
from kaizen.trust.execution_context import (
    ExecutionContext,
    get_current_context,
    execution_context
)
```

Modify `execute_async()` method:

```python
async def execute_async(
    self,
    inputs: Dict[str, Any],
    action: str,
    resource: str,
    context: Optional[ExecutionContext] = None,  # NEW PARAMETER
    **kwargs
) -> Any:
    """
    Execute with Trust Sandwich pattern.

    EATP Enhancement: Now accepts and propagates ExecutionContext.
    All operations are traced back to the human_origin.

    Args:
        inputs: Input data for the agent
        action: The action being performed
        resource: The resource being accessed
        context: ExecutionContext with human_origin
        **kwargs: Additional arguments for the agent

    Returns:
        Result from the wrapped agent

    Raises:
        TrustError: If no context available
        TrustVerificationError: If verification fails
    """
    # Get context from parameter or context variable
    ctx = context or get_current_context()
    if not ctx:
        raise TrustError(
            "No ExecutionContext available. All operations must have "
            "a human_origin. Use PseudoAgent to initiate trust chains."
        )

    # Set context for this execution scope
    with execution_context(ctx):
        # STEP 1: VERIFY
        verification = await self._trust_ops.verify(
            agent_id=self._agent.agent_id,
            action=action,
            resource=resource,
            level=VerificationLevel.STANDARD,
            context={"delegation_chain": ctx.delegation_chain}
        )

        if not verification.valid:
            # Log failed verification with human_origin for audit
            await self._trust_ops.audit(
                agent_id=self._agent.agent_id,
                action=action,
                resource=resource,
                result=ActionResult.DENIED,
                context_data={"reason": verification.reason},
                context=ctx
            )
            raise TrustVerificationError(
                f"Verification failed for {action} on {resource}: {verification.reason}"
            )

        # STEP 2: EXECUTE
        try:
            result = await self._agent.execute_async(inputs=inputs, **kwargs)
            action_result = ActionResult.SUCCESS
        except Exception as e:
            action_result = ActionResult.ERROR
            # Still audit the failure
            await self._trust_ops.audit(
                agent_id=self._agent.agent_id,
                action=action,
                resource=resource,
                result=ActionResult.ERROR,
                context_data={"error": str(e)},
                context=ctx
            )
            raise

        # STEP 3: AUDIT
        await self._trust_ops.audit(
            agent_id=self._agent.agent_id,
            action=action,
            resource=resource,
            result=action_result,
            context_data={"inputs_hash": hash(str(inputs))},
            context=ctx  # human_origin included
        )

        return result
```

Modify `TrustedSupervisorAgent.delegate_to_worker()`:

```python
async def delegate_to_worker(
    self,
    worker: 'TrustedAgent',
    task: Dict[str, Any],
    capabilities: List[str],
    additional_constraints: Optional[Dict[str, Any]] = None
) -> Any:
    """
    Delegate work to a worker agent with context propagation.

    EATP: Creates delegation and propagates human_origin to worker.
    """
    ctx = get_current_context()
    if not ctx:
        raise TrustError("No ExecutionContext - cannot delegate")

    # Create delegation with human_origin
    delegation = await self._trust_ops.delegate(
        delegator_id=self._agent.agent_id,
        delegatee_id=worker.agent_id,
        task_id=str(uuid.uuid4()),
        capabilities=capabilities,
        additional_constraints=additional_constraints or {},
        context=ctx
    )

    # Create context for worker (human_origin preserved)
    worker_ctx = ctx.with_delegation(worker.agent_id, additional_constraints)

    # Execute worker with propagated context
    return await worker.execute_async(
        inputs=task,
        action="delegated_task",
        resource=delegation.task_id,
        context=worker_ctx
    )
```

### Testing Objectives for Task 6

```python
# tests/trust/test_trusted_agent_eatp.py

class TestTrustedAgentWithContext:
    """Tests for EATP-enhanced TrustedAgent."""

    @pytest.mark.asyncio
    async def test_execute_requires_context(self):
        """Execute MUST fail without ExecutionContext."""
        agent = TrustedAgent(mock_agent, trust_ops)

        with pytest.raises(TrustError) as exc:
            await agent.execute_async(
                inputs={},
                action="read",
                resource="test"
                # No context!
            )

        assert "No ExecutionContext" in str(exc.value)

    @pytest.mark.asyncio
    async def test_execute_with_context_succeeds(self):
        """Execute with valid context MUST succeed."""
        ctx = ExecutionContext(human_origin=origin, ...)
        agent = TrustedAgent(mock_agent, trust_ops)

        result = await agent.execute_async(
            inputs={"data": "test"},
            action="read",
            resource="test",
            context=ctx
        )

        assert result is not None

    @pytest.mark.asyncio
    async def test_execute_creates_audit_with_human_origin(self):
        """Audit anchor MUST have human_origin after execution."""
        ctx = ExecutionContext(human_origin=origin, ...)
        agent = TrustedAgent(mock_agent, trust_ops)

        await agent.execute_async(
            inputs={},
            action="read",
            resource="test",
            context=ctx
        )

        # Verify audit was created with human_origin
        audits = await get_recent_audits(agent.agent_id)
        assert audits[0].human_origin.human_id == "alice@corp.com"

    @pytest.mark.asyncio
    async def test_failed_verification_still_audits(self):
        """Failed verification MUST still create audit record."""
        # Setup: agent doesn't have required capability
        ctx = ExecutionContext(human_origin=origin, ...)

        with pytest.raises(TrustVerificationError):
            await agent.execute_async(
                inputs={},
                action="admin_action",  # Not authorized
                resource="test",
                context=ctx
            )

        # Verify denial was audited
        audits = await get_recent_audits(agent.agent_id)
        assert audits[0].result == ActionResult.DENIED


class TestTrustedSupervisorWithContext:
    """Tests for EATP-enhanced TrustedSupervisorAgent."""

    @pytest.mark.asyncio
    async def test_delegate_to_worker_propagates_human_origin(self):
        """
        CRITICAL TEST: Human origin MUST propagate through delegation.
        """
        ctx = ExecutionContext(
            human_origin=HumanOrigin(human_id="alice@corp.com", ...),
            delegation_chain=["pseudo:alice", "supervisor-agent"]
        )

        with execution_context(ctx):
            result = await supervisor.delegate_to_worker(
                worker=worker_agent,
                task={"data": "test"},
                capabilities=["read"]
            )

        # Worker's audit should have Alice as human_origin
        worker_audits = await get_recent_audits(worker_agent.agent_id)
        assert worker_audits[0].human_origin.human_id == "alice@corp.com"
```

### Acceptance Criteria for Task 6

- [ ] `execute_async()` fails with clear error if no context
- [ ] `execute_async()` accepts and uses `context` parameter
- [ ] Verification failure creates audit with `ActionResult.DENIED`
- [ ] Successful execution creates audit with `human_origin`
- [ ] `delegate_to_worker()` propagates `human_origin` to worker
- [ ] Worker's audits show original human's `human_origin`
- [ ] Context propagates correctly through nested async calls

---

## Task 7: Database Schema Updates

### Reference
- `07-data-flows.md` → "Data Storage Schema"

### Migration Script

Create migration file: `migrations/eatp_human_origin.py`

```python
"""
Database migration for EATP human_origin fields.

Adds new columns to delegations and audit_anchors tables.
Backward compatible - existing data continues to work.
"""

async def upgrade(db):
    """Add EATP columns."""

    # Add columns to delegations table
    await db.execute("""
        ALTER TABLE delegations
        ADD COLUMN IF NOT EXISTS human_origin JSONB,
        ADD COLUMN IF NOT EXISTS delegation_chain TEXT[],
        ADD COLUMN IF NOT EXISTS delegation_depth INTEGER DEFAULT 0
    """)

    # Add index for fast human_origin lookup
    await db.execute("""
        CREATE INDEX IF NOT EXISTS idx_delegations_human_origin
        ON delegations ((human_origin->>'human_id'))
    """)

    # Add column to audit_anchors table
    await db.execute("""
        ALTER TABLE audit_anchors
        ADD COLUMN IF NOT EXISTS human_origin JSONB
    """)

    # Add index for audit queries by human
    await db.execute("""
        CREATE INDEX IF NOT EXISTS idx_audit_human_origin
        ON audit_anchors ((human_origin->>'human_id'))
    """)


async def downgrade(db):
    """Remove EATP columns (if needed)."""

    await db.execute("""
        DROP INDEX IF EXISTS idx_delegations_human_origin;
        DROP INDEX IF EXISTS idx_audit_human_origin;

        ALTER TABLE delegations
        DROP COLUMN IF EXISTS human_origin,
        DROP COLUMN IF EXISTS delegation_chain,
        DROP COLUMN IF EXISTS delegation_depth;

        ALTER TABLE audit_anchors
        DROP COLUMN IF EXISTS human_origin;
    """)
```

### Acceptance Criteria for Task 7

- [ ] Migration runs without error on existing database
- [ ] Existing data remains accessible after migration
- [ ] New columns have correct types (JSONB, TEXT[], INTEGER)
- [ ] Indexes are created for efficient queries
- [ ] Downgrade migration works if rollback needed

---

## 8. Testing Requirements

### Test Categories

| Category | Coverage Requirement | Purpose |
|----------|---------------------|---------|
| Unit Tests | 100% of new code | Verify individual functions |
| Integration Tests | All operations | Verify end-to-end flows |
| Performance Tests | SLA compliance | Verify <1s cascade revocation |
| Regression Tests | All existing tests pass | No breaking changes |

### Critical Test Scenarios

The following scenarios MUST pass before the implementation is considered complete:

#### Scenario 1: End-to-End Human Origin Tracing

```python
@pytest.mark.asyncio
async def test_end_to_end_human_origin_tracing():
    """
    CRITICAL: Verify human origin traces through entire chain.

    Setup:
      Alice (human) -> Manager Agent -> Worker Agent -> ESA -> Database

    Assert:
      Every audit record has Alice as human_origin.
    """
    # 1. Create PseudoAgent for Alice
    factory = PseudoAgentFactory(trust_ops)
    alice = factory.from_session(
        user_id="user-123",
        email="alice@corp.com",
        display_name="Alice Chen",
        session_id="sess-456",
        auth_provider="okta"
    )

    # 2. Delegate to manager
    _, manager_ctx = await alice.delegate_to(
        agent_id="manager-agent",
        task_id="task-1",
        capabilities=["read", "delegate"],
        constraints={"cost_limit": 10000}
    )

    # 3. Manager delegates to worker
    manager = TrustedSupervisorAgent(manager_agent, trust_ops)
    with execution_context(manager_ctx):
        await manager.delegate_to_worker(
            worker=worker_agent,
            task={"action": "read_data"},
            capabilities=["read"],
            additional_constraints={"cost_limit": 1000}
        )

    # 4. Verify all audits have Alice as human_origin
    all_audits = await get_all_audits()
    for audit in all_audits:
        assert audit.human_origin is not None
        assert audit.human_origin.human_id == "alice@corp.com"
```

#### Scenario 2: Cascade Revocation

```python
@pytest.mark.asyncio
async def test_cascade_revocation_on_human_departure():
    """
    CRITICAL: When human leaves, ALL their delegations cascade revoke.
    """
    # Setup: Alice has 3 delegations, each with sub-delegations
    await setup_alice_delegation_tree()  # 10 agents total

    # Act: Alice leaves company
    revoked = await trust_ops.revoke_by_human(
        "alice@corp.com",
        "Employee termination"
    )

    # Assert: All 10 agents revoked
    assert len(revoked) == 10

    # Assert: No agent from Alice's tree can execute
    for agent_id in revoked:
        with pytest.raises(TrustVerificationError):
            await verify_agent(agent_id)
```

#### Scenario 3: Constraint Tightening Enforcement

```python
@pytest.mark.asyncio
async def test_constraint_loosening_is_blocked():
    """
    CRITICAL: Delegations CANNOT loosen constraints.
    """
    alice = create_pseudo_agent("alice@corp.com")
    _, ctx = await alice.delegate_to(
        agent_id="manager",
        capabilities=["read"],
        constraints={"cost_limit": 1000}  # $1000 limit
    )

    # Manager tries to delegate with HIGHER limit
    with execution_context(ctx):
        with pytest.raises(ConstraintViolationError):
            await trust_ops.delegate(
                delegator_id="manager",
                delegatee_id="worker",
                capabilities=["read"],
                additional_constraints={"cost_limit": 5000},  # LOOSENED!
                context=ctx
            )
```

---

## 9. Acceptance Criteria

### Must Pass

All of the following MUST be true before this implementation is considered complete:

1. **Human Origin Tracing**
   - [ ] Every `DelegationRecord` created via `PseudoAgent` has `human_origin`
   - [ ] Every `AuditAnchor` has `human_origin` when context is available
   - [ ] `human_origin` is NEVER modified after creation (immutable)
   - [ ] Delegation chain correctly tracks path from human to current agent

2. **PseudoAgent**
   - [ ] Factory creates valid `PseudoAgent` from session/JWT
   - [ ] `delegate_to()` creates delegation with `human_origin`
   - [ ] `create_execution_context()` starts chain with pseudo-agent ID

3. **Cascade Revocation**
   - [ ] `revoke_cascade()` revokes ALL downstream agents
   - [ ] `revoke_by_human()` finds and revokes all delegations from human
   - [ ] Cascade completes in <1 second for 100 agents

4. **Constraint Validation**
   - [ ] Cost limit loosening is REJECTED
   - [ ] Time window expansion is REJECTED
   - [ ] Resource expansion is REJECTED
   - [ ] Multiple violations are all reported

5. **Backward Compatibility**
   - [ ] All existing tests pass
   - [ ] Operations without context work (for legacy code)
   - [ ] Legacy records (without `human_origin`) deserialize correctly

---

## 10. Definition of Done

This implementation is DONE when:

- [ ] All 7 tasks are complete
- [ ] All acceptance criteria are met
- [ ] All tests pass (unit, integration, performance)
- [ ] Code review approved
- [ ] Documentation updated (`__init__.py` exports, docstrings)
- [ ] Migration script tested on staging
- [ ] No regressions in existing functionality

---

## Questions or Clarifications

For questions about this implementation, refer to:

1. **Architecture**: `docs/plans/eatp-integration/05-architecture-design.md`
2. **Technical Specs**: `docs/plans/eatp-integration/04-gap-analysis.md`
3. **Data Flows**: `docs/plans/eatp-integration/07-data-flows.md`
4. **Visual Reference**: `docs/plans/eatp-integration/09-visual-reference.md`

For implementation questions not covered in documentation, contact the architect.
