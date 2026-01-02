# Enterprise Agent Trust Protocol (EATP) Frontend

Complete frontend implementation for the Kailash Kaizen Enterprise Agent Trust Protocol.

## Overview

This module provides TypeScript types, API client, React hooks, and state management for interacting with the EATP backend trust system. It supports all core EATP operations: ESTABLISH, VERIFY, DELEGATE, and AUDIT.

## Directory Structure

```
src/features/trust/
├── api/                    # API client functions
│   └── index.ts           # Trust API endpoints
├── components/            # React components (to be added)
├── hooks/                 # React Query hooks
│   └── index.ts          # useTrustChain, useVerifyTrust, etc.
├── store/                 # Zustand state management
│   └── trust.ts          # Global trust UI state
├── types/                 # TypeScript type definitions
│   └── index.ts          # Complete EATP type system
├── index.ts              # Main exports
└── README.md             # This file
```

## Quick Start

### 1. Import Types

```typescript
import type {
  TrustChain,
  VerificationResult,
  GenesisRecord,
  CapabilityAttestation,
  DelegationRecord,
} from "@/features/trust";
```

### 2. Use React Hooks

```typescript
import { useTrustChain, useVerifyTrust } from "@/features/trust";

function AgentTrustView({ agentId }: { agentId: string }) {
  // Fetch trust chain
  const { data: chain, isPending } = useTrustChain(agentId);

  // Verify trust mutation
  const { mutate: verify } = useVerifyTrust();

  const handleVerify = () => {
    verify({
      agent_id: agentId,
      action: "analyze_data",
      level: "standard",
    });
  };

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      <h2>Agent: {chain.genesis.agent_id}</h2>
      <p>Authority: {chain.genesis.authority_id}</p>
      <button onClick={handleVerify}>Verify Trust</button>
    </div>
  );
}
```

### 3. Use API Client Directly

```typescript
import { trustApi } from "@/features/trust";

// Establish trust for a new agent
const chain = await trustApi.establishTrust({
  agent_id: "agent-123",
  authority_id: "org-acme",
  capabilities: [
    {
      capability: "analyze_data",
      capability_type: "access",
      constraints: ["read_only"],
    },
  ],
});

// Verify trust
const result = await trustApi.verifyTrust({
  agent_id: "agent-123",
  action: "analyze_data",
  level: "standard",
});
```

### 4. Use Global State

```typescript
import { useTrustStore } from "@/features/trust";

function TrustDashboard() {
  const { selectedChain, setSelectedChain, ui, setSelectedTab } =
    useTrustStore();

  return (
    <div>
      <button onClick={() => setSelectedTab("chains")}>Trust Chains</button>
      <button onClick={() => setSelectedTab("audit")}>Audit Trail</button>
      {selectedChain && <TrustChainDetail chain={selectedChain} />}
    </div>
  );
}
```

## Core Types

### TrustChain

The complete trust lineage for an agent:

```typescript
interface TrustChain {
  genesis: GenesisRecord;
  capabilities: CapabilityAttestation[];
  delegations: DelegationRecord[];
  constraint_envelope: ConstraintEnvelope | null;
  audit_anchors: AuditAnchor[];
  chain_hash: string;
}
```

### VerificationResult

Result of a trust verification operation:

```typescript
interface VerificationResult {
  valid: boolean;
  level: VerificationLevel;
  reason: string | null;
  capability_used: string | null;
  effective_constraints: string[];
  violations: ConstraintViolation[];
  latency_ms?: number;
}
```

### Enums

- **AuthorityType**: `ORGANIZATION`, `SYSTEM`, `HUMAN`
- **CapabilityType**: `ACCESS`, `ACTION`, `DELEGATION`
- **ActionResult**: `SUCCESS`, `FAILURE`, `DENIED`, `PARTIAL`
- **ConstraintType**: `RESOURCE_LIMIT`, `TIME_WINDOW`, `DATA_SCOPE`, `ACTION_RESTRICTION`, `AUDIT_REQUIREMENT`
- **VerificationLevel**: `QUICK`, `STANDARD`, `FULL`
- **TrustStatus**: `VALID`, `EXPIRED`, `REVOKED`, `PENDING`, `INVALID`

## Available Hooks

### Trust Chain Management

- `useTrustChain(agentId)` - Get trust chain for an agent
- `useTrustChains(params)` - List all trust chains
- `useAgentCapabilities(agentId)` - Get agent capabilities
- `useAgentConstraints(agentId)` - Get agent constraints

### Trust Operations

- `useEstablishTrust()` - Establish trust for a new agent
- `useVerifyTrust()` - Verify trust for an action
- `useDelegateTrust()` - Delegate trust between agents
- `useAuditAction()` - Record an agent action
- `useRevokeTrust()` - Revoke agent trust
- `useRevokeDelegation()` - Revoke a delegation

### Audit Operations

- `useAuditTrail(query)` - Query audit trail
- `useComplianceReport(orgId, start, end)` - Get compliance report

### Agent Registry

- `useAgentMetadata(agentId)` - Get agent metadata
- `useDiscoverAgents(query)` - Discover agents by capabilities/tags
- `useRegisterAgent()` - Register a new agent
- `useUpdateAgentHeartbeat()` - Update agent heartbeat

### Authority Management

- `useAuthority(authorityId)` - Get organizational authority
- `useAuthorities()` - List all authorities

## API Endpoints

All API calls use the base URL from `VITE_API_URL` environment variable (default: `http://localhost:8000`).

### Core Operations

- `POST /api/v1/trust/establish` - ESTABLISH operation
- `POST /api/v1/trust/verify` - VERIFY operation
- `POST /api/v1/trust/delegate` - DELEGATE operation
- `POST /api/v1/trust/audit` - AUDIT operation

### Management

- `GET /api/v1/trust/chains/:agentId` - Get trust chain
- `GET /api/v1/trust/chains` - List trust chains
- `POST /api/v1/trust/revoke` - Revoke trust
- `POST /api/v1/trust/revoke-delegation` - Revoke delegation

### Audit

- `GET /api/v1/trust/audit` - Query audit trail
- `GET /api/v1/trust/compliance/:organizationId` - Get compliance report

### Registry

- `POST /api/v1/trust/registry/agents` - Register agent
- `POST /api/v1/trust/registry/discover` - Discover agents
- `GET /api/v1/trust/registry/agents/:agentId` - Get agent metadata
- `POST /api/v1/trust/registry/agents/:agentId/heartbeat` - Update heartbeat

### Authorities

- `GET /api/v1/trust/authorities/:authorityId` - Get authority
- `GET /api/v1/trust/authorities` - List authorities

## State Management

The `useTrustStore` provides global state for:

- **Selected Chain**: Currently viewed trust chain
- **Recent Verifications**: Last 50 verification results
- **Dashboard Stats**: Cached statistics for performance
- **Filters**: Search, status, date range filters
- **UI State**: Sidebar, panels, selected tab

```typescript
const {
  selectedChain,
  setSelectedChain,
  recentVerifications,
  addVerification,
  dashboardStats,
  filters,
  setFilters,
  ui,
  setSelectedTab,
} = useTrustStore();
```

## Backend Integration

This frontend module is designed to work with the EATP backend implementation at:

```
apps/kailash-kaizen/src/kaizen/trust/
```

Key backend modules:

- `chain.py` - Core data structures
- `operations.py` - ESTABLISH, VERIFY, DELEGATE, AUDIT operations
- `store.py` - PostgreSQL trust chain storage
- `authority.py` - Organizational authority management
- `audit_service.py` - Audit query and compliance reporting
- `registry/` - Agent discovery and health monitoring (Week 5)
- `messaging/` - Secure agent-to-agent communication (Week 6)
- `orchestration/` - Trust-aware workflow execution (Week 7)

## Next Steps

### 1. Components to Build

- `TrustChainList` - List of trust chains with filtering
- `TrustChainDetail` - Detailed view of a single trust chain
- `VerificationPanel` - Real-time verification results
- `AuditTrailView` - Audit trail with filtering and export
- `DelegationTree` - Visual delegation chain
- `ComplianceReport` - Compliance report viewer
- `AgentDiscovery` - Agent discovery interface

### 2. Additional Features

- Real-time trust chain updates via WebSockets
- Trust chain visualization (graph/tree view)
- Audit trail export (CSV, JSON, PDF)
- Compliance report scheduling
- Agent health monitoring dashboard
- Trust metrics and analytics

### 3. Testing

- Unit tests for types and utilities
- Integration tests for API client
- E2E tests for trust workflows

## Example: Complete Trust Workflow

```typescript
import {
  useEstablishTrust,
  useVerifyTrust,
  useDelegateTrust,
  useAuditAction,
  CapabilityType,
  ActionResult,
} from "@/features/trust";

function TrustWorkflowExample() {
  const { mutate: establish } = useEstablishTrust();
  const { mutate: verify } = useVerifyTrust();
  const { mutate: delegate } = useDelegateTrust();
  const { mutate: audit } = useAuditAction();

  const runWorkflow = async () => {
    // 1. Establish trust for primary agent
    establish({
      agent_id: "agent-primary",
      authority_id: "org-acme",
      capabilities: [
        {
          capability: "analyze_data",
          capability_type: CapabilityType.ACCESS,
          constraints: ["read_only"],
        },
      ],
    });

    // 2. Verify trust before action
    verify(
      {
        agent_id: "agent-primary",
        action: "analyze_data",
        level: "standard",
      },
      {
        onSuccess: (result) => {
          if (result.valid) {
            // 3. Perform action and audit
            audit({
              agent_id: "agent-primary",
              action: "analyze_data",
              resource: "dataset-123",
              result: ActionResult.SUCCESS,
            });

            // 4. Delegate to worker agent
            delegate({
              delegator_id: "agent-primary",
              delegatee_id: "agent-worker",
              task_id: "task-123",
              capabilities: ["analyze_data"],
              additional_constraints: ["data_scope:department_A"],
            });
          }
        },
      }
    );
  };

  return <button onClick={runWorkflow}>Run Trust Workflow</button>;
}
```

## Contributing

When adding new features:

1. Add types to `types/index.ts`
2. Add API functions to `api/index.ts`
3. Add React hooks to `hooks/index.ts`
4. Add state management to `store/trust.ts` if needed
5. Export new items from `index.ts`
6. Update this README

## License

Part of the Kailash Kaizen Enterprise AI platform.
