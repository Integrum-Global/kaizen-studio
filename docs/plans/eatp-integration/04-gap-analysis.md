# Gap Analysis: EATP Vision vs Current Implementation

## Gap Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GAP PRIORITY MATRIX                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   IMPACT                                                                │
│     ▲                                                                   │
│     │                                                                   │
│ CRITICAL │  ┌───────────────┐      ┌───────────────┐                   │
│     │    │  │ G1: root_     │      │ G2: Pseudo    │                   │
│     │    │  │ source        │      │ Agent         │                   │
│     │    │  └───────────────┘      └───────────────┘                   │
│     │                                                                   │
│  HIGH    │  ┌───────────────┐      ┌───────────────┐                   │
│     │    │  │ G3: Cascade   │      │ G4: Constraint│                   │
│     │    │  │ Revocation    │      │ Validation    │                   │
│     │    │  └───────────────┘      └───────────────┘                   │
│     │                                                                   │
│  MEDIUM  │  ┌───────────────┐      ┌───────────────┐                   │
│     │    │  │ G5: Governance│      │ G6: SLA       │                   │
│     │    │  │ Mesh          │      │ Monitoring    │                   │
│     │    │  └───────────────┘      └───────────────┘                   │
│     │                                                                   │
│     └────┼──────────────────┼──────────────────────┼──────► EFFORT     │
│          │      LOW         │      MEDIUM          │  HIGH             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## G1: root_source Tracing (CRITICAL)

### The Gap

**EATP Requirement**: Every agent action MUST trace back to the human who authorized it.

**Current State**: No `root_source` field exists in delegation records or A2A messages.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE root_source GAP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   CURRENT IMPLEMENTATION:                                               │
│   ────────────────────────                                              │
│                                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐          │
│   │  Alice  │────►│ Agent A │────►│ Agent B │────►│ Agent C │          │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘          │
│                        │               │               │                │
│                        │               │               │                │
│                   delegator:      delegator:      delegator:           │
│                   "alice"         "agent-a"       "agent-b"            │
│                                                                         │
│   Problem: Agent C knows Agent B delegated to it, but WHO started      │
│            this chain? We lose the human origin as we go deeper.       │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   REQUIRED IMPLEMENTATION:                                              │
│   ─────────────────────────                                             │
│                                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐          │
│   │  Alice  │────►│ Agent A │────►│ Agent B │────►│ Agent C │          │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘          │
│        │               │               │               │                │
│        └───────────────┴───────────────┴───────────────┘                │
│                              │                                          │
│                    root_source: "alice@company.com"                     │
│                              +                                          │
│                    delegation_chain: [A, B, C]                          │
│                                                                         │
│   Every agent in the chain knows Alice is the ultimate authority.      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Specification

```python
# REQUIRED CHANGES IN chain.py

@dataclass
class HumanOrigin:
    """Represents the human source of all delegations."""
    human_id: str              # e.g., "alice@company.com"
    auth_method: str           # e.g., "sso", "ldap", "oauth2"
    session_id: str            # Current session
    authenticated_at: datetime
    auth_provider: str         # e.g., "okta", "azure-ad"
    metadata: Dict[str, Any]   # Additional context

@dataclass
class DelegationRecord:
    delegator_id: str
    delegatee_id: str
    task_id: str
    delegated_capabilities: List[str]
    delegated_at: datetime
    expires_at: Optional[datetime]
    constraints: Dict[str, Any]

    # NEW REQUIRED FIELDS:
    root_source: HumanOrigin           # ← The human who started this
    delegation_chain: List[str]         # ← Full chain: [human, A, B, ...]
    delegation_depth: int               # ← How deep in the chain

@dataclass
class AuditAnchor:
    # ... existing fields ...

    # NEW REQUIRED FIELD:
    root_source: HumanOrigin           # ← Who ultimately authorized this
```

### Impact Analysis

| Component | Changes Required |
|-----------|------------------|
| `chain.py` | Add `HumanOrigin`, update `DelegationRecord`, `AuditAnchor` |
| `operations.py` | Propagate `root_source` in `delegate()`, `audit()` |
| `trusted_agent.py` | Pass `root_source` through execution context |
| `a2a/models.py` | Add `root_source` to A2A message format |
| Tests | New tests for root_source propagation |

**Effort Estimate**: Medium (core data structure change)

---

## G2: PseudoAgent (CRITICAL)

### The Gap

**EATP Requirement**: Humans need a programmatic representation (facade) in the agentic system.

**Current State**: `AuthorityType.HUMAN` exists but no `PseudoAgent` class.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE PSEUDO AGENT GAP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   CURRENT STATE:                                                        │
│   ──────────────                                                        │
│                                                                         │
│   ┌───────────────────────┐                                            │
│   │   LEGACY AUTH SYSTEMS │                                            │
│   │   ┌─────┐  ┌─────┐    │                                            │
│   │   │LDAP │  │ SSO │    │         ┌─────────────────┐                │
│   │   └─────┘  └─────┘    │   ???   │  AGENT SYSTEM   │                │
│   │   ┌─────┐  ┌─────┐    │ ──────► │                 │                │
│   │   │OAuth│  │ SAML│    │         │  (no bridge)    │                │
│   │   └─────┘  └─────┘    │         │                 │                │
│   └───────────────────────┘         └─────────────────┘                │
│                                                                         │
│   Problem: No bridge between human authentication and agent trust.     │
│                                                                         │
│   ─────────────────────────────────────────────────────────────────    │
│                                                                         │
│   REQUIRED STATE:                                                       │
│   ───────────────                                                       │
│                                                                         │
│   ┌───────────────────────┐         ┌─────────────────┐                │
│   │   LEGACY AUTH SYSTEMS │         │  AGENT SYSTEM   │                │
│   │   ┌─────┐  ┌─────┐    │         │                 │                │
│   │   │LDAP │  │ SSO │    │         │  ┌───────────┐  │                │
│   │   └─────┘  └─────┘    │ ──────► │  │  Pseudo   │  │                │
│   │   ┌─────┐  ┌─────┐    │         │  │  Agent    │  │                │
│   │   │OAuth│  │ SAML│    │         │  │  (Alice)  │  │                │
│   │   └─────┘  └─────┘    │         │  └───────────┘  │                │
│   └───────────────────────┘         └─────────────────┘                │
│                                          │                              │
│                                          ▼                              │
│                                    ┌───────────┐                       │
│                                    │  Agent A  │                       │
│                                    │ delegated │                       │
│                                    │ by Alice  │                       │
│                                    └───────────┘                       │
│                                                                         │
│   PseudoAgent is the GENESIS POINT for all trust delegations.          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Specification

```python
# NEW FILE: src/kaizen/trust/pseudo_agent.py

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum

class AuthProvider(str, Enum):
    """Supported authentication providers."""
    LDAP = "ldap"
    SAML = "saml"
    OAUTH2 = "oauth2"
    OIDC = "oidc"
    AZURE_AD = "azure_ad"
    OKTA = "okta"
    CUSTOM = "custom"


@dataclass
class HumanIdentity:
    """
    Verified human identity from auth provider.
    This is the bridge between legacy auth and EATP.
    """
    # Core identity
    user_id: str                   # Unique user ID from auth system
    email: str                     # Primary email
    display_name: str              # Human-readable name

    # Auth context
    auth_provider: AuthProvider
    auth_provider_id: str          # Provider-specific ID
    groups: List[str]              # Group memberships (for RBAC mapping)
    roles: List[str]               # Role memberships

    # Session context
    session_id: str
    authenticated_at: datetime
    session_expires_at: datetime

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)


class PseudoAgent:
    """
    Human facade in the EATP system.

    PseudoAgents are the ONLY entities that can be root_source.
    They bridge human authentication to agent trust.

    Key Properties:
    - Cannot be delegated TO (only FROM)
    - Always the root of trust chains
    - Tied to a human identity
    - Session-scoped (expires with auth session)
    """

    def __init__(
        self,
        human_identity: HumanIdentity,
        trust_operations: TrustOperations,
        default_constraints: Optional[Dict[str, Any]] = None
    ):
        self._identity = human_identity
        self._trust_ops = trust_operations
        self._default_constraints = default_constraints or {}

        # Generate pseudo-agent ID from human identity
        self._pseudo_agent_id = f"pseudo:{human_identity.user_id}"

        # Active delegations from this human
        self._active_delegations: List[str] = []

    @property
    def pseudo_agent_id(self) -> str:
        return self._pseudo_agent_id

    @property
    def human_origin(self) -> HumanOrigin:
        """Create HumanOrigin for delegation records."""
        return HumanOrigin(
            human_id=self._identity.user_id,
            email=self._identity.email,
            auth_method=self._identity.auth_provider.value,
            session_id=self._identity.session_id,
            authenticated_at=self._identity.authenticated_at,
            auth_provider=self._identity.auth_provider_id,
            metadata={
                "display_name": self._identity.display_name,
                "groups": self._identity.groups,
                "roles": self._identity.roles,
            }
        )

    async def delegate_to_agent(
        self,
        agent_id: str,
        task_id: str,
        capabilities: List[str],
        constraints: Optional[Dict[str, Any]] = None,
        expires_at: Optional[datetime] = None
    ) -> DelegationRecord:
        """
        Delegate trust from human to agent.

        This is the ONLY way trust enters the agentic system.
        The returned DelegationRecord will have root_source set
        to this PseudoAgent's human_origin.
        """
        merged_constraints = {**self._default_constraints}
        if constraints:
            merged_constraints.update(constraints)

        delegation = await self._trust_ops.delegate(
            delegator_id=self._pseudo_agent_id,
            delegatee_id=agent_id,
            task_id=task_id,
            capabilities=capabilities,
            additional_constraints=merged_constraints,
            expires_at=expires_at,
            root_source=self.human_origin,  # ← KEY: Set root_source
            delegation_chain=[self._pseudo_agent_id],  # ← Start chain
            delegation_depth=0
        )

        self._active_delegations.append(delegation.delegation_id)
        return delegation

    async def revoke_all_delegations(self, reason: str = "Human session ended"):
        """
        Revoke ALL delegations from this human.
        Called when human logs out or session expires.
        """
        for delegation_id in self._active_delegations:
            await self._trust_ops.revoke_delegation(
                delegation_id=delegation_id,
                reason=reason,
                cascade=True  # ← Revoke all downstream delegations
            )
        self._active_delegations.clear()

    def is_session_valid(self) -> bool:
        """Check if the human's auth session is still valid."""
        return datetime.utcnow() < self._identity.session_expires_at


class PseudoAgentFactory:
    """
    Factory for creating PseudoAgents from auth tokens.
    Integrates with various auth providers.
    """

    def __init__(self, trust_operations: TrustOperations):
        self._trust_ops = trust_operations
        self._adapters: Dict[AuthProvider, AuthAdapter] = {}

    def register_adapter(self, provider: AuthProvider, adapter: 'AuthAdapter'):
        """Register an auth adapter for a provider."""
        self._adapters[provider] = adapter

    async def from_token(
        self,
        token: str,
        provider: AuthProvider
    ) -> PseudoAgent:
        """
        Create PseudoAgent from auth token.

        This validates the token with the auth provider and
        creates a PseudoAgent bound to the verified identity.
        """
        adapter = self._adapters.get(provider)
        if not adapter:
            raise ValueError(f"No adapter for provider: {provider}")

        # Verify token and get identity
        identity = await adapter.verify_and_extract(token)

        return PseudoAgent(
            human_identity=identity,
            trust_operations=self._trust_ops
        )


class AuthAdapter(ABC):
    """Base class for auth provider adapters."""

    @abstractmethod
    async def verify_and_extract(self, token: str) -> HumanIdentity:
        """Verify token and extract human identity."""
        pass


class OktaAdapter(AuthAdapter):
    """Okta-specific auth adapter."""
    pass


class AzureADAdapter(AuthAdapter):
    """Azure AD auth adapter."""
    pass
```

### Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PSEUDO AGENT INTEGRATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   STUDIO UI                          KAILASH-KAIZEN SDK                │
│   ═════════                          ═════════════════                 │
│                                                                         │
│   ┌─────────────────┐               ┌─────────────────┐                │
│   │  Login Page     │───────────────│  PseudoAgent    │                │
│   │  (SSO redirect) │   token       │  Factory        │                │
│   └─────────────────┘               └────────┬────────┘                │
│                                              │                          │
│                                              ▼                          │
│   ┌─────────────────┐               ┌─────────────────┐                │
│   │  Dashboard      │◄──────────────│  PseudoAgent    │                │
│   │  (show active   │   session     │  (alice)        │                │
│   │   delegations)  │               └────────┬────────┘                │
│   └─────────────────┘                        │                          │
│                                              │ delegate                 │
│   ┌─────────────────┐                        ▼                          │
│   │  Agent Config   │               ┌─────────────────┐                │
│   │  (select agent, │───────────────│  TrustedAgent   │                │
│   │   set tasks)    │   user action │  (with root_    │                │
│   └─────────────────┘               │   source=alice) │                │
│                                     └─────────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Effort Estimate**: Medium (new component, integrates with existing)

---

## G3: Cascade Revocation (HIGH)

### The Gap

**EATP Requirement**: When a human's access is revoked, ALL delegations must cascade.

**Current State**: `revoke()` exists but doesn't cascade.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CASCADE REVOCATION GAP                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SCENARIO: Alice leaves the company                                   │
│   ──────────────────────────────────                                    │
│                                                                         │
│   Trust Chain:                                                          │
│   ┌───────┐     ┌───────┐     ┌───────┐     ┌───────┐                  │
│   │ Alice │────►│Agent A│────►│Agent B│────►│Agent C│                  │
│   └───────┘     └───────┘     └───────┘     └───────┘                  │
│                                                                         │
│   CURRENT BEHAVIOR (❌ WRONG):                                          │
│   ─────────────────────────────                                         │
│   Alice revoked ──► Agent A revoked ──► Agent B STILL ACTIVE!          │
│                                              Agent C STILL ACTIVE!      │
│                                                                         │
│   REQUIRED BEHAVIOR (✅ CORRECT):                                       │
│   ────────────────────────────────                                      │
│   Alice revoked ──► Agent A revoked ──► Agent B revoked                │
│                                              Agent C revoked            │
│                                                                         │
│   All agents delegated from Alice must be immediately revoked.         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Specification

```python
# ENHANCED: src/kaizen/trust/operations.py

class TrustOperations:

    async def revoke(
        self,
        agent_id: str,
        reason: str,
        cascade: bool = True  # ← NEW: Default to cascade
    ) -> RevocationResult:
        """
        Revoke trust for an agent.

        If cascade=True, also revoke all agents that received
        delegations from this agent (recursively).
        """
        revoked_agents = []

        # Revoke this agent
        await self._revoke_single(agent_id, reason)
        revoked_agents.append(agent_id)

        if cascade:
            # Find all delegations FROM this agent
            delegations = await self._find_delegations_from(agent_id)

            for delegation in delegations:
                # Recursively revoke
                result = await self.revoke(
                    agent_id=delegation.delegatee_id,
                    reason=f"Cascade from {agent_id}: {reason}",
                    cascade=True
                )
                revoked_agents.extend(result.revoked_agents)

        return RevocationResult(
            root_agent_id=agent_id,
            revoked_agents=revoked_agents,
            revocation_time=datetime.utcnow(),
            reason=reason
        )

    async def revoke_by_root_source(
        self,
        root_source_id: str,
        reason: str
    ) -> RevocationResult:
        """
        Revoke ALL delegations from a specific human (root_source).

        Called when a human's access is revoked (e.g., leaves company).
        """
        # Find all delegations where root_source matches
        delegations = await self._find_delegations_by_root_source(root_source_id)

        revoked_agents = []
        for delegation in delegations:
            result = await self.revoke(
                agent_id=delegation.delegatee_id,
                reason=f"Root source revoked ({root_source_id}): {reason}",
                cascade=True
            )
            revoked_agents.extend(result.revoked_agents)

        return RevocationResult(
            root_agent_id=f"root:{root_source_id}",
            revoked_agents=revoked_agents,
            revocation_time=datetime.utcnow(),
            reason=reason
        )


@dataclass
class RevocationResult:
    """Result of a revocation operation."""
    root_agent_id: str
    revoked_agents: List[str]
    revocation_time: datetime
    reason: str
    cascade_depth: int = 0
```

### Performance Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CASCADE PERFORMANCE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Challenge: Deep delegation chains could cause slow revocation.       │
│                                                                         │
│   Solution: Parallel cascade with depth limiting                       │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                                                               │    │
│   │   async def revoke_cascade_parallel(root_id):                 │    │
│   │       level_0 = [root_id]                                     │    │
│   │       level_1 = find_delegatees(level_0)  # Parallel          │    │
│   │       level_2 = find_delegatees(level_1)  # Parallel          │    │
│   │       ...                                                     │    │
│   │       # Revoke all levels in parallel                         │    │
│   │       await asyncio.gather(*[revoke(a) for a in all_agents]) │    │
│   │                                                               │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   Target: <1 second for 1000 agents in cascade                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Effort Estimate**: Low-Medium (algorithm change, index optimization)

---

## G4: Formal Constraint Tightening Validation (HIGH)

### The Gap

**EATP Requirement**: Delegations can ONLY tighten constraints, never loosen.

**Current State**: Basic merge, no formal validation.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT TIGHTENING GAP                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   EXAMPLE SCENARIO:                                                     │
│                                                                         │
│   Manager Agent has:                                                    │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  cost_limit: $10,000                                          │    │
│   │  time_window: "09:00-17:00"                                   │    │
│   │  resources: ["invoices/*", "reports/*"]                       │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   Worker Agent CANNOT have:                                            │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  cost_limit: $50,000      ❌ LOOSER (higher limit)            │    │
│   │  time_window: "00:00-23:59" ❌ LOOSER (wider window)          │    │
│   │  resources: ["*"]          ❌ LOOSER (more resources)         │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   Worker Agent CAN have:                                               │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │  cost_limit: $1,000       ✅ TIGHTER (lower limit)            │    │
│   │  time_window: "10:00-16:00" ✅ TIGHTER (narrower window)      │    │
│   │  resources: ["invoices/*"] ✅ TIGHTER (fewer resources)       │    │
│   └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Specification

```python
# NEW: src/kaizen/trust/constraint_validator.py

from dataclasses import dataclass
from typing import Dict, Any, List, Tuple
from enum import Enum


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
    violations: List[ConstraintViolation]
    details: Dict[str, str]


class ConstraintValidator:
    """
    Validates that child constraints are strictly tighter than parent.

    Rule: A delegation can only REMOVE permissions, never ADD them.
    """

    def validate_tightening(
        self,
        parent_constraints: Dict[str, Any],
        child_constraints: Dict[str, Any]
    ) -> ValidationResult:
        """
        Validate that child constraints are subset of parent.

        Returns ValidationResult with any violations found.
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
            if not self._is_time_subset(
                parent_constraints.get("time_window"),
                child_constraints["time_window"]
            ):
                violations.append(ConstraintViolation.TIME_WINDOW_EXPANDED)
                details["time_window"] = "Child window not subset of parent"

        # Check resources
        if "resources" in child_constraints:
            if not self._is_resource_subset(
                parent_constraints.get("resources", []),
                child_constraints["resources"]
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
            if not parent_geo or not child_geo.issubset(parent_geo):
                violations.append(ConstraintViolation.GEO_RESTRICTION_REMOVED)
                details["geo"] = "Child geo not subset of parent"

        return ValidationResult(
            valid=len(violations) == 0,
            violations=violations,
            details=details
        )

    def _is_time_subset(
        self,
        parent_window: str,
        child_window: str
    ) -> bool:
        """Check if child time window is within parent."""
        # Parse "HH:MM-HH:MM" format
        if not parent_window:
            return True  # No parent restriction

        p_start, p_end = self._parse_time_window(parent_window)
        c_start, c_end = self._parse_time_window(child_window)

        return c_start >= p_start and c_end <= p_end

    def _is_resource_subset(
        self,
        parent_resources: List[str],
        child_resources: List[str]
    ) -> bool:
        """Check if child resources are subset of parent (with glob matching)."""
        if not parent_resources:
            return True  # No parent restriction

        for child_res in child_resources:
            if not any(self._glob_match(parent, child_res) for parent in parent_resources):
                return False
        return True

    def _glob_match(self, pattern: str, path: str) -> bool:
        """Simple glob matching for resource paths."""
        import fnmatch
        return fnmatch.fnmatch(path, pattern)

    def _parse_time_window(self, window: str) -> Tuple[int, int]:
        """Parse time window to minutes from midnight."""
        start, end = window.split("-")
        return self._time_to_minutes(start), self._time_to_minutes(end)

    def _time_to_minutes(self, time_str: str) -> int:
        """Convert HH:MM to minutes from midnight."""
        h, m = map(int, time_str.split(":"))
        return h * 60 + m
```

**Effort Estimate**: Low (standalone validator, integrate with delegate())

---

## G5: Governance Mesh (MEDIUM)

### The Gap

**EATP Requirement**: Distributed policy enforcement across organizational boundaries.

**Current State**: Centralized `ExternalAgentPolicyEngine`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE MESH GAP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   CURRENT: Centralized Policy Engine                                   │
│   ─────────────────────────────────                                     │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   All Agents ──────────► Single Policy Engine ──────► Decision  │  │
│   │                              (single point of failure)          │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   REQUIRED: Distributed Governance Mesh                                │
│   ──────────────────────────────────────                                │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │           ┌─────────────┐                                       │  │
│   │           │ Corporate   │                                       │  │
│   │           │ Policy Node │                                       │  │
│   │           └──────┬──────┘                                       │  │
│   │                  │                                              │  │
│   │        ┌─────────┼─────────┐                                    │  │
│   │        │         │         │                                    │  │
│   │        ▼         ▼         ▼                                    │  │
│   │   ┌────────┐ ┌────────┐ ┌────────┐                             │  │
│   │   │Finance │ │  HR    │ │  IT    │                             │  │
│   │   │Policy  │ │Policy  │ │Policy  │                             │  │
│   │   │Node    │ │Node    │ │Node    │                             │  │
│   │   └────────┘ └────────┘ └────────┘                             │  │
│   │                                                                 │  │
│   │   Policies federated. Each node enforces local + parent.       │  │
│   │   No single point of failure.                                  │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technical Specification

```python
# NEW: src/kaizen/trust/governance/mesh.py

class GovernanceMeshNode:
    """
    A node in the governance mesh.
    Each node can have local policies + inherit from parent.
    """

    def __init__(
        self,
        node_id: str,
        parent_node: Optional['GovernanceMeshNode'] = None,
        local_policies: List[ExternalAgentPolicy] = None
    ):
        self.node_id = node_id
        self.parent_node = parent_node
        self.local_engine = ExternalAgentPolicyEngine()

        for policy in (local_policies or []):
            self.local_engine.add_policy(policy)

    async def evaluate(
        self,
        context: ExternalAgentPolicyContext
    ) -> PolicyEvaluationResult:
        """
        Evaluate policies at this node AND all ancestors.

        Conflict Resolution:
        - DENY at any level = DENY
        - ALLOW requires ALLOW at all levels
        """
        # Evaluate local policies
        local_result = await self.local_engine.evaluate_policies(context)

        if local_result.effect == PolicyEffect.DENY:
            return local_result  # Local DENY wins

        # Evaluate parent policies
        if self.parent_node:
            parent_result = await self.parent_node.evaluate(context)
            if parent_result.effect == PolicyEffect.DENY:
                return parent_result  # Parent DENY wins

        return local_result


class GovernanceMesh:
    """
    Distributed governance mesh across organizational units.
    """

    def __init__(self):
        self._nodes: Dict[str, GovernanceMeshNode] = {}
        self._root: Optional[GovernanceMeshNode] = None

    def add_node(
        self,
        node_id: str,
        parent_id: Optional[str] = None,
        policies: List[ExternalAgentPolicy] = None
    ):
        """Add a governance node."""
        parent = self._nodes.get(parent_id) if parent_id else None
        node = GovernanceMeshNode(node_id, parent, policies)
        self._nodes[node_id] = node

        if parent_id is None:
            self._root = node

    async def evaluate_for_org_unit(
        self,
        org_unit_id: str,
        context: ExternalAgentPolicyContext
    ) -> PolicyEvaluationResult:
        """
        Evaluate policies for a specific organizational unit.
        Walks up the hierarchy from the unit to the root.
        """
        node = self._nodes.get(org_unit_id)
        if not node:
            raise ValueError(f"Unknown org unit: {org_unit_id}")

        return await node.evaluate(context)
```

**Effort Estimate**: Medium-High (new distributed architecture)

---

## G6: Verification SLA Monitoring (MEDIUM)

### The Gap

**EATP Requirement**: QUICK <1ms, STANDARD <5ms, FULL <50ms with monitoring.

**Current State**: Levels exist, no SLA enforcement or metrics.

```python
# ENHANCEMENT: src/kaizen/trust/operations.py

@dataclass
class VerificationMetrics:
    """Metrics for verification SLA monitoring."""
    level: VerificationLevel
    target_ms: float
    actual_ms: float
    sla_met: bool
    timestamp: datetime


class TrustOperations:

    def __init__(self, ...):
        # ... existing init ...
        self._verification_metrics: List[VerificationMetrics] = []
        self._sla_targets = {
            VerificationLevel.QUICK: 1.0,
            VerificationLevel.STANDARD: 5.0,
            VerificationLevel.FULL: 50.0
        }

    async def verify(
        self,
        agent_id: str,
        action: str,
        level: VerificationLevel = VerificationLevel.STANDARD,
        ...
    ) -> VerificationResult:
        """Verify with SLA monitoring."""
        import time

        target_ms = self._sla_targets[level]
        start = time.perf_counter()

        # ... existing verification logic ...
        result = await self._do_verify(agent_id, action, level, ...)

        actual_ms = (time.perf_counter() - start) * 1000
        sla_met = actual_ms <= target_ms

        # Record metrics
        metric = VerificationMetrics(
            level=level,
            target_ms=target_ms,
            actual_ms=actual_ms,
            sla_met=sla_met,
            timestamp=datetime.utcnow()
        )
        self._verification_metrics.append(metric)

        # Log SLA violations
        if not sla_met:
            logger.warning(
                f"Verification SLA violation: {level.value} took {actual_ms:.2f}ms "
                f"(target: {target_ms}ms)"
            )

        return result

    def get_sla_metrics(self) -> Dict[str, Any]:
        """Get SLA compliance metrics."""
        # ... aggregate metrics ...
```

**Effort Estimate**: Low (instrumentation change)

---

## Gap Summary Table

| ID | Gap | Priority | Effort | Where |
|----|-----|----------|--------|-------|
| G1 | root_source tracing | CRITICAL | Medium | SDK |
| G2 | PseudoAgent | CRITICAL | Medium | SDK |
| G3 | Cascade revocation | HIGH | Low-Med | SDK |
| G4 | Constraint validation | HIGH | Low | SDK |
| G5 | Governance Mesh | MEDIUM | Med-High | SDK |
| G6 | SLA monitoring | MEDIUM | Low | SDK |

**Total SDK Changes Required**: 6 components

**Studio Changes**: UI for visualization (covered in implementation matrix)
