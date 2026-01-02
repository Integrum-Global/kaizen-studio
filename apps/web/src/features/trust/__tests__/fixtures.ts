/**
 * Mock data fixtures for trust component tests
 */

import {
  TrustChain,
  GenesisRecord,
  CapabilityAttestation,
  DelegationRecord,
  ConstraintEnvelope,
  AuditAnchor,
  Constraint,
  TrustDashboardStats,
  VerificationResult,
  TrustStatus,
  AuthorityType,
  CapabilityType,
  ActionResult,
  ConstraintType,
  VerificationLevel,
  ESAConfig,
  ESAHealthStatus,
  EnforcementMode,
} from "../types";
import type { Authority } from "../types/authority";

// ============================================================================
// Genesis Records
// ============================================================================

export function createMockGenesisRecord(
  overrides?: Partial<GenesisRecord>
): GenesisRecord {
  return {
    id: "genesis-123",
    agent_id: "agent-123",
    authority_id: "authority-org-1",
    authority_type: AuthorityType.ORGANIZATION,
    created_at: "2024-01-01T00:00:00Z",
    expires_at: "2025-01-01T00:00:00Z",
    signature: "signature-hash-abc123",
    signature_algorithm: "Ed25519",
    metadata: { environment: "production" },
    ...overrides,
  };
}

// ============================================================================
// Capability Attestations
// ============================================================================

export function createMockCapabilityAttestation(
  overrides?: Partial<CapabilityAttestation>
): CapabilityAttestation {
  return {
    id: "capability-123",
    capability: "read_data",
    capability_type: CapabilityType.ACCESS,
    constraints: ["constraint-1", "constraint-2"],
    attester_id: "authority-org-1",
    attested_at: "2024-01-01T00:00:00Z",
    expires_at: "2025-01-01T00:00:00Z",
    signature: "capability-signature-xyz789",
    scope: { resource_type: "database", resource_id: "db-123" },
    ...overrides,
  };
}

// ============================================================================
// Delegations
// ============================================================================

export function createMockDelegationRecord(
  overrides?: Partial<DelegationRecord>
): DelegationRecord {
  return {
    id: "delegation-123",
    delegator_id: "agent-123",
    delegatee_id: "agent-456",
    task_id: "task-789",
    capabilities_delegated: ["read_data", "write_data"],
    constraint_subset: ["constraint-1"],
    delegated_at: "2024-01-02T00:00:00Z",
    expires_at: "2024-12-31T23:59:59Z",
    signature: "delegation-signature-def456",
    parent_delegation_id: null,
    ...overrides,
  };
}

// ============================================================================
// Constraints
// ============================================================================

export function createMockConstraint(
  overrides?: Partial<Constraint>
): Constraint {
  return {
    id: "constraint-1",
    constraint_type: ConstraintType.RESOURCE_LIMIT,
    value: { max_requests: 1000, time_window: "1h" },
    source: "genesis",
    priority: 1,
    ...overrides,
  };
}

export function createMockConstraintEnvelope(
  overrides?: Partial<ConstraintEnvelope>
): ConstraintEnvelope {
  return {
    id: "envelope-123",
    agent_id: "agent-123",
    active_constraints: [
      createMockConstraint(),
      createMockConstraint({
        id: "constraint-2",
        constraint_type: ConstraintType.TIME_WINDOW,
        value: { start_time: "09:00", end_time: "17:00" },
        source: "capability",
        priority: 2,
      }),
    ],
    computed_at: "2024-01-01T00:00:00Z",
    valid_until: "2025-01-01T00:00:00Z",
    constraint_hash: "constraint-envelope-hash-123",
    ...overrides,
  };
}

// ============================================================================
// Audit Anchors
// ============================================================================

export function createMockAuditAnchor(
  overrides?: Partial<AuditAnchor>
): AuditAnchor {
  return {
    id: "audit-123",
    agent_id: "agent-123",
    action: "read_database",
    resource: "database://db-123/table-users",
    timestamp: "2024-01-03T10:30:00Z",
    trust_chain_hash: "trust-chain-hash-abc",
    result: ActionResult.SUCCESS,
    signature: "audit-signature-ghi789",
    parent_anchor_id: null,
    context: { query: "SELECT * FROM users", rows_returned: 42 },
    ...overrides,
  };
}

// ============================================================================
// Trust Chains
// ============================================================================

export function createMockTrustChain(
  overrides?: Partial<TrustChain>
): TrustChain {
  return {
    genesis: createMockGenesisRecord(),
    capabilities: [
      createMockCapabilityAttestation(),
      createMockCapabilityAttestation({
        id: "capability-456",
        capability: "write_data",
        capability_type: CapabilityType.ACTION,
      }),
    ],
    delegations: [createMockDelegationRecord()],
    constraint_envelope: createMockConstraintEnvelope(),
    audit_anchors: [
      createMockAuditAnchor(),
      createMockAuditAnchor({
        id: "audit-456",
        action: "write_database",
        result: ActionResult.SUCCESS,
        timestamp: "2024-01-03T11:00:00Z",
      }),
    ],
    chain_hash: "trust-chain-hash-abc",
    ...overrides,
  };
}

export function createMockTrustChainWithoutDelegations(): TrustChain {
  return createMockTrustChain({
    delegations: [],
  });
}

export function createMockTrustChainWithoutCapabilities(): TrustChain {
  return createMockTrustChain({
    capabilities: [],
  });
}

export function createMockTrustChainWithoutAudits(): TrustChain {
  return createMockTrustChain({
    audit_anchors: [],
  });
}

export function createMockTrustChainWithoutConstraints(): TrustChain {
  return createMockTrustChain({
    constraint_envelope: null,
  });
}

// ============================================================================
// Dashboard Stats
// ============================================================================

export function createMockTrustDashboardStats(
  overrides?: Partial<TrustDashboardStats>
): TrustDashboardStats {
  return {
    total_agents: 150,
    active_agents: 120,
    expired_agents: 25,
    revoked_agents: 5,
    total_verifications_24h: 5432,
    failed_verifications_24h: 12,
    total_delegations: 340,
    active_delegations: 285,
    recent_audits: [
      createMockAuditAnchor(),
      createMockAuditAnchor({
        id: "audit-789",
        action: "delete_resource",
        result: ActionResult.DENIED,
        timestamp: "2024-01-03T12:00:00Z",
      }),
      createMockAuditAnchor({
        id: "audit-101",
        action: "update_config",
        result: ActionResult.FAILURE,
        timestamp: "2024-01-03T12:30:00Z",
      }),
    ],
    ...overrides,
  };
}

// ============================================================================
// Verification Results
// ============================================================================

export function createMockVerificationResult(
  overrides?: Partial<VerificationResult>
): VerificationResult {
  return {
    valid: true,
    level: VerificationLevel.STANDARD,
    reason: null,
    capability_used: "read_data",
    effective_constraints: ["constraint-1", "constraint-2"],
    violations: [],
    latency_ms: 5,
    ...overrides,
  };
}

export function createMockFailedVerificationResult(): VerificationResult {
  return createMockVerificationResult({
    valid: false,
    reason: "Capability not found",
    capability_used: null,
    violations: [
      {
        constraint_id: "constraint-1",
        constraint: "resource_limit",
        constraint_value: "1000",
        reason: "Exceeded max_requests limit",
      },
    ],
  });
}

// ============================================================================
// API Response Helpers
// ============================================================================

export function createMockTrustChainsListResponse() {
  return {
    items: [
      createMockTrustChain(),
      createMockTrustChain({
        genesis: createMockGenesisRecord({
          agent_id: "agent-456",
          id: "genesis-456",
        }),
        chain_hash: "trust-chain-hash-def",
      }),
      createMockTrustChain({
        genesis: createMockGenesisRecord({
          agent_id: "agent-789",
          id: "genesis-789",
        }),
        chain_hash: "trust-chain-hash-ghi",
      }),
    ],
    total: 3,
  };
}

export function createMockAuditTrailResponse() {
  return {
    items: [
      createMockAuditAnchor(),
      createMockAuditAnchor({
        id: "audit-456",
        action: "write_database",
        timestamp: "2024-01-03T11:00:00Z",
      }),
      createMockAuditAnchor({
        id: "audit-789",
        action: "delete_resource",
        result: ActionResult.DENIED,
        timestamp: "2024-01-03T12:00:00Z",
      }),
    ],
    total: 3,
  };
}

// ============================================================================
// ESA Config (Phase 4)
// ============================================================================

export function createMockESAConfig(
  overrides?: Partial<ESAConfig>
): ESAConfig {
  return {
    id: "esa-config-123",
    agent_id: "esa-agent-456",
    enforcement_mode: EnforcementMode.AUDIT_ONLY,
    authority_id: "authority-org-1",
    default_capabilities: ["access:read:database", "action:write:logs"],
    system_constraints: ["constraint-1", "constraint-2"],
    is_active: true,
    health_status: ESAHealthStatus.HEALTHY,
    last_check_at: "2024-01-15T10:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

// ============================================================================
// Authority (Phase 4)
// ============================================================================

export function createMockAuthority(
  overrides?: Partial<Authority>
): Authority {
  return {
    id: "authority-123",
    name: "Acme Corporation",
    type: AuthorityType.ORGANIZATION,
    description: "Primary organizational authority for Acme Corp agents",
    parentAuthorityId: undefined,
    isActive: true,
    agentCount: 42,
    certificateHash: "cert-hash-abc123def456",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    metadata: {},
    ...overrides,
  };
}

// ============================================================================
// Phase 4 Part 2: Trust Metrics, Agent Card, Pipeline Trust Fixtures
// ============================================================================

/**
 * Trust Metrics fixtures
 */
export function createMockTrustMetrics(overrides?: Partial<any>): any {
  return {
    timeRange: {
      start: new Date("2024-01-01"),
      end: new Date("2024-01-08"),
      preset: "7d" as const,
    },
    summary: {
      totalEstablishments: 150,
      establishmentsTrend: 12.5,
      activeDelegations: 45,
      delegationsTrend: -3.2,
      verificationSuccessRate: 98.5,
      successRateTrend: 2.1,
      totalAuditEvents: 5432,
      auditEventsTrend: 8.7,
    },
    activityOverTime: [
      {
        date: "2024-01-01",
        establishments: 20,
        delegations: 8,
        revocations: 1,
        verifications: 850,
      },
      {
        date: "2024-01-02",
        establishments: 18,
        delegations: 6,
        revocations: 2,
        verifications: 820,
      },
      {
        date: "2024-01-03",
        establishments: 25,
        delegations: 10,
        revocations: 0,
        verifications: 900,
      },
    ],
    delegationDistribution: [
      { name: "Direct", value: 25, percentage: 55.6 },
      { name: "Sub-delegated", value: 15, percentage: 33.3 },
      { name: "Expired", value: 5, percentage: 11.1 },
    ],
    topCapabilities: [
      { capability: "read_data", count: 120, percentage: 45.3 },
      { capability: "write_data", count: 85, percentage: 32.1 },
      { capability: "delete_data", count: 60, percentage: 22.6 },
    ],
    constraintViolations: [
      {
        date: "2024-01-01",
        resourceLimit: 5,
        timeWindow: 2,
        dataScope: 1,
        actionRestriction: 0,
        auditRequirement: 0,
      },
      {
        date: "2024-01-02",
        resourceLimit: 3,
        timeWindow: 1,
        dataScope: 2,
        actionRestriction: 1,
        auditRequirement: 0,
      },
    ],
    ...overrides,
  };
}

/**
 * Agent with Trust information
 */
export function createMockAgentWithTrust(overrides?: Partial<any>): any {
  return {
    id: "agent-123",
    name: "Test Agent",
    trust_status: TrustStatus.VALID,
    trust_chain_id: "chain-123",
    capabilities: ["read_data", "write_data", "execute_task"],
    constraints: ["time_window:9-17", "max_requests:1000"],
    protocols: ["HTTP", "WebSocket", "gRPC"],
    endpoints: [
      { name: "REST API", url: "https://api.example.com/agent-123" },
      { name: "WebSocket", url: "wss://ws.example.com/agent-123" },
    ],
    established_by: "Test Authority",
    expires_at: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
    ...overrides,
  };
}

/**
 * Pipeline trust validation response
 */
export function createMockPipelineTrustValidation(
  overrides?: Partial<any>
): any {
  return {
    pipelineId: "pipeline-123",
    isReady: true,
    totalAgents: 3,
    trustedAgents: 3,
    untrustedAgents: 0,
    expiredAgents: 0,
    agentStatuses: [
      {
        agentId: "agent-123",
        agentName: "Agent 1",
        nodeId: "node-1",
        trustStatus: TrustStatus.VALID,
        requiredCapabilities: ["read_data"],
        availableCapabilities: ["read_data", "write_data"],
        missingCapabilities: [],
        constraintViolations: [],
        isValid: true,
      },
      {
        agentId: "agent-456",
        agentName: "Agent 2",
        nodeId: "node-2",
        trustStatus: TrustStatus.VALID,
        requiredCapabilities: ["write_data"],
        availableCapabilities: ["write_data"],
        missingCapabilities: [],
        constraintViolations: [],
        isValid: true,
      },
      {
        agentId: "agent-789",
        agentName: "Agent 3",
        nodeId: "node-3",
        trustStatus: TrustStatus.VALID,
        requiredCapabilities: ["execute_task"],
        availableCapabilities: ["execute_task"],
        missingCapabilities: [],
        constraintViolations: [],
        isValid: true,
      },
    ],
    ...overrides,
  };
}

/**
 * Agent trust summary for badge component
 */
export function createMockAgentTrustSummary(overrides?: Partial<any>): any {
  return {
    agentId: "agent-123",
    agentName: "Test Agent",
    status: TrustStatus.VALID,
    authorityName: "Test Authority",
    authorityType: AuthorityType.ORGANIZATION,
    capabilityCount: 3,
    constraintCount: 2,
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    isExpiringSoon: false,
    verifiedAt: new Date().toISOString(),
    ...overrides,
  };
}
