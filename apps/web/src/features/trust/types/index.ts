/**
 * Enterprise Agent Trust Protocol (EATP) TypeScript Types
 *
 * These types mirror the backend EATP implementation from kailash-kaizen/src/kaizen/trust/
 * for trust chain management, verification, delegation, and audit operations.
 */

// Export authority-specific types
export * from "./authority";

// ============================================================================
// Enums
// ============================================================================

/**
 * Type of authority that can establish trust
 */
export enum AuthorityType {
  ORGANIZATION = "organization",
  SYSTEM = "system",
  HUMAN = "human",
}

/**
 * Type of capability an agent can have
 */
export enum CapabilityType {
  ACCESS = "access",
  ACTION = "action",
  DELEGATION = "delegation",
}

/**
 * Result of an agent action
 */
export enum ActionResult {
  SUCCESS = "success",
  FAILURE = "failure",
  DENIED = "denied",
  PARTIAL = "partial",
}

/**
 * Type of constraint on agent behavior
 */
export enum ConstraintType {
  RESOURCE_LIMIT = "resource_limit",
  TIME_WINDOW = "time_window",
  DATA_SCOPE = "data_scope",
  ACTION_RESTRICTION = "action_restriction",
  AUDIT_REQUIREMENT = "audit_requirement",
}

/**
 * Level of trust verification thoroughness
 */
export enum VerificationLevel {
  QUICK = "quick", // Hash + expiration only (~1ms)
  STANDARD = "standard", // + Capability match, constraints (~5ms)
  FULL = "full", // + Signature verification (~50ms)
}

/**
 * Trust verification status
 */
export enum TrustStatus {
  VALID = "valid",
  EXPIRED = "expired",
  REVOKED = "revoked",
  PENDING = "pending",
  INVALID = "invalid",
}

// ============================================================================
// Core Data Structures
// ============================================================================

/**
 * Cryptographic proof of agent authorization
 *
 * The genesis record establishes the origin of trust for an agent.
 * Every agent must have exactly one genesis record that proves
 * its authorization to exist.
 */
export interface GenesisRecord {
  id: string;
  agent_id: string;
  authority_id: string;
  authority_type: AuthorityType;
  created_at: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime or null
  signature: string;
  signature_algorithm: string; // Default: "Ed25519"
  metadata: Record<string, any>;
}

/**
 * Cryptographic proof of agent capability
 *
 * Declares what an agent can do. Each capability comes with
 * constraints and cryptographic proof from an attester.
 */
export interface CapabilityAttestation {
  id: string;
  capability: string;
  capability_type: CapabilityType;
  constraints: string[];
  attester_id: string;
  attested_at: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime or null
  signature: string;
  scope: Record<string, any> | null;
}

/**
 * Record of trust delegation between agents
 *
 * Tracks the chain of trust when one agent delegates work to another.
 * Ensures constraints can only be tightened, never loosened.
 */
export interface DelegationRecord {
  id: string;
  delegator_id: string;
  delegatee_id: string;
  task_id: string;
  capabilities_delegated: string[];
  constraint_subset: string[];
  delegated_at: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime or null
  signature: string;
  parent_delegation_id: string | null;
}

/**
 * Individual constraint definition
 */
export interface Constraint {
  id: string;
  constraint_type: ConstraintType;
  value: any;
  source: string;
  priority: number;
}

/**
 * Aggregated constraints governing agent behavior
 *
 * Combines constraints from genesis, capabilities, and delegations
 * into a single envelope for efficient constraint evaluation.
 */
export interface ConstraintEnvelope {
  id: string;
  agent_id: string;
  active_constraints: Constraint[];
  computed_at: string | null; // ISO 8601 datetime
  valid_until: string | null; // ISO 8601 datetime
  constraint_hash: string;
}

/**
 * Immutable record of agent action
 *
 * Creates an audit trail for agent actions, enabling post-hoc
 * verification and compliance reporting.
 */
export interface AuditAnchor {
  id: string;
  agent_id: string;
  action: string;
  resource: string | null;
  timestamp: string; // ISO 8601 datetime
  trust_chain_hash: string;
  result: ActionResult;
  signature: string;
  parent_anchor_id: string | null;
  context: Record<string, any>;
}

/**
 * Complete trust lineage for an agent
 *
 * The Trust Lineage Chain is the core data structure of EATP,
 * containing all trust information for an agent in a cryptographically
 * verifiable sequence.
 */
export interface TrustChain {
  genesis: GenesisRecord;
  capabilities: CapabilityAttestation[];
  delegations: DelegationRecord[];
  constraint_envelope: ConstraintEnvelope | null;
  audit_anchors: AuditAnchor[];
  chain_hash: string;
}

// ============================================================================
// Verification Results
// ============================================================================

/**
 * Violation detail for constraint evaluation
 */
export interface ConstraintViolation {
  constraint_id?: string;
  constraint?: string;
  constraint_value?: string;
  reason: string;
}

/**
 * Result of trust verification
 *
 * Contains the outcome of a VERIFY operation with details
 * about what capability was used and any violations.
 */
export interface VerificationResult {
  valid: boolean;
  level: VerificationLevel;
  reason: string | null;
  capability_used: string | null;
  effective_constraints: string[];
  violations: ConstraintViolation[];
  latency_ms?: number; // Optional: verification latency for monitoring
}

/**
 * Result of constraint evaluation
 */
export interface ConstraintEvaluationResult {
  permitted: boolean;
  violations: ConstraintViolation[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to establish trust for a new agent
 */
export interface EstablishTrustRequest {
  agent_id: string;
  authority_id: string;
  capabilities: CapabilityRequest[];
  constraints?: string[];
  metadata?: Record<string, any>;
  expires_at?: string | null; // ISO 8601 datetime
}

/**
 * Request for a capability during ESTABLISH
 */
export interface CapabilityRequest {
  capability: string;
  capability_type: CapabilityType;
  constraints?: string[];
  scope?: Record<string, any>;
}

/**
 * Request to delegate trust between agents
 */
export interface DelegateTrustRequest {
  delegator_id: string;
  delegatee_id: string;
  task_id: string;
  capabilities: string[];
  additional_constraints?: string[];
  expires_at?: string | null; // ISO 8601 datetime
  metadata?: Record<string, any>;
}

/**
 * Request to verify trust for an action
 */
export interface VerifyTrustRequest {
  agent_id: string;
  action: string;
  resource?: string | null;
  level?: VerificationLevel;
  context?: Record<string, any>;
}

/**
 * Request to audit an agent action
 */
export interface AuditActionRequest {
  agent_id: string;
  action: string;
  resource?: string | null;
  result?: ActionResult;
  context?: Record<string, any>;
  parent_anchor_id?: string | null;
}

/**
 * Request to revoke trust
 */
export interface RevokeTrustRequest {
  agent_id: string;
  reason?: string;
}

/**
 * Request to revoke delegation
 */
export interface RevokeDelegationRequest {
  delegation_id: string;
  delegatee_id: string;
}

// ============================================================================
// Authority Types
// ============================================================================

/**
 * Authority permissions
 */
export enum AuthorityPermission {
  CREATE_AGENTS = "create_agents",
  REVOKE_AGENTS = "revoke_agents",
  MANAGE_CAPABILITIES = "manage_capabilities",
  VIEW_AUDIT_TRAIL = "view_audit_trail",
}

/**
 * Organizational authority definition
 */
export interface OrganizationalAuthority {
  id: string;
  name: string;
  authority_type: AuthorityType;
  public_key: string;
  signing_key_id: string;
  permissions: AuthorityPermission[];
  created_at: string; // ISO 8601 datetime
  is_active: boolean;
  metadata: Record<string, any>;
}

// ============================================================================
// Audit Query Types
// ============================================================================

/**
 * Query parameters for audit trail
 */
export interface AuditQuery {
  agent_id?: string;
  action?: string;
  resource?: string;
  result?: ActionResult;
  start_time?: string; // ISO 8601 datetime
  end_time?: string; // ISO 8601 datetime
  page?: number;
  page_size?: number;
}

/**
 * Summary of agent actions for compliance reporting
 */
export interface ActionSummary {
  action: string;
  count: number;
  success_count: number;
  failure_count: number;
  denied_count: number;
}

/**
 * Summary of agent audit trail
 */
export interface AgentAuditSummary {
  agent_id: string;
  total_actions: number;
  action_breakdown: ActionSummary[];
  first_action: string | null; // ISO 8601 datetime
  last_action: string | null; // ISO 8601 datetime
}

/**
 * Compliance report for audit trail
 */
export interface ComplianceReport {
  organization_id: string;
  start_time: string; // ISO 8601 datetime
  end_time: string; // ISO 8601 datetime
  total_agents: number;
  total_actions: number;
  agent_summaries: AgentAuditSummary[];
  constraint_violations: ConstraintViolation[];
  generated_at: string; // ISO 8601 datetime
}

// ============================================================================
// Agent Registry Types (Week 5)
// ============================================================================

/**
 * Agent status in registry
 */
export enum AgentStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  DEGRADED = "degraded",
  MAINTENANCE = "maintenance",
}

/**
 * Agent health status
 */
export enum HealthStatus {
  HEALTHY = "healthy",
  UNHEALTHY = "unhealthy",
  DEGRADED = "degraded",
  UNKNOWN = "unknown",
}

/**
 * Agent metadata in registry
 */
export interface AgentMetadata {
  agent_id: string;
  name: string;
  description: string;
  capabilities: string[];
  tags: string[];
  status: AgentStatus;
  health_status: HealthStatus;
  endpoint: string;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  last_heartbeat: string | null; // ISO 8601 datetime
  metadata: Record<string, any>;
}

/**
 * Agent registration request
 */
export interface RegistrationRequest {
  agent_id: string;
  name: string;
  description?: string;
  capabilities?: string[];
  tags?: string[];
  endpoint: string;
  metadata?: Record<string, any>;
}

/**
 * Agent discovery query
 */
export interface DiscoveryQuery {
  capabilities?: string[];
  tags?: string[];
  status?: AgentStatus;
  health_status?: HealthStatus;
}

// ============================================================================
// Secure Messaging Types (Week 6)
// ============================================================================

/**
 * Secure message envelope
 */
export interface SecureMessageEnvelope {
  id: string;
  sender_id: string;
  recipient_id: string;
  payload: string; // Encrypted
  signature: string;
  metadata: MessageMetadata;
  created_at: string; // ISO 8601 datetime
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  nonce: string;
  timestamp: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime
  correlation_id: string | null;
  message_type: string;
}

/**
 * Message verification result
 */
export interface MessageVerificationResult {
  valid: boolean;
  reason: string | null;
  sender_verified: boolean;
  signature_valid: boolean;
  not_expired: boolean;
  not_replayed: boolean;
}

/**
 * Channel statistics
 */
export interface ChannelStatistics {
  messages_sent: number;
  messages_received: number;
  messages_failed: number;
  average_latency_ms: number;
  last_message_at: string | null; // ISO 8601 datetime
}

// ============================================================================
// Orchestration Types (Week 7)
// ============================================================================

/**
 * Trust execution context for workflows
 */
export interface TrustExecutionContext {
  agent_id: string;
  trust_chain_hash: string;
  effective_constraints: string[];
  delegation_chain: DelegationEntry[];
  start_time: string; // ISO 8601 datetime
  context_id: string;
}

/**
 * Delegation entry in execution context
 */
export interface DelegationEntry {
  delegation_id: string;
  delegator_id: string;
  delegatee_id: string;
  delegated_capabilities: string[];
  added_constraints: string[];
}

/**
 * Trust policy type
 */
export enum PolicyType {
  REQUIRE_CAPABILITY = "require_capability",
  REQUIRE_CONSTRAINT = "require_constraint",
  FORBID_DELEGATION = "forbid_delegation",
  REQUIRE_AUDIT = "require_audit",
}

/**
 * Trust policy definition
 */
export interface TrustPolicy {
  id: string;
  name: string;
  policy_type: PolicyType;
  conditions: Record<string, any>;
  enabled: boolean;
}

/**
 * Policy evaluation result
 */
export interface PolicyResult {
  policy_id: string;
  passed: boolean;
  reason: string | null;
}

// ============================================================================
// A2A (Agent-to-Agent) Types (Week 9)
// ============================================================================

/**
 * Agent card for discovery
 */
export interface AgentCard {
  agent_id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  trust_extensions: TrustExtensions;
  endpoints: Record<string, string>;
  created_at: string; // ISO 8601 datetime
}

/**
 * Agent capability in agent card
 */
export interface AgentCapability {
  name: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

/**
 * Trust extensions in agent card
 */
export interface TrustExtensions {
  trust_established: boolean;
  trust_chain_hash: string | null;
  authority_id: string | null;
  capabilities: string[];
  constraints: string[];
}

/**
 * A2A token for authentication
 */
export interface A2AToken {
  agent_id: string;
  issued_at: string; // ISO 8601 datetime
  expires_at: string; // ISO 8601 datetime
  signature: string;
}

// ============================================================================
// Cache Types (Week 11)
// ============================================================================

/**
 * Cache entry for trust chains
 */
export interface CacheEntry {
  chain: TrustChain;
  cached_at: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime
  hit_count: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  total_entries: number;
  hit_rate: number;
  miss_rate: number;
  eviction_count: number;
  average_hit_latency_ms: number;
}

// ============================================================================
// Credential Rotation Types (Week 11)
// ============================================================================

/**
 * Rotation status
 */
export enum RotationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Rotation result
 */
export interface RotationResult {
  agent_id: string;
  old_key_id: string;
  new_key_id: string;
  rotated_at: string; // ISO 8601 datetime
  status: RotationStatus;
  error: string | null;
}

/**
 * Rotation status info
 */
export interface RotationStatusInfo {
  agent_id: string;
  status: RotationStatus;
  last_rotation: string | null; // ISO 8601 datetime
  next_rotation: string | null; // ISO 8601 datetime
}

/**
 * Scheduled rotation
 */
export interface ScheduledRotation {
  agent_id: string;
  scheduled_at: string; // ISO 8601 datetime
  rotation_interval_days: number;
}

// ============================================================================
// Security Types (Week 11)
// ============================================================================

/**
 * Security event type
 */
export enum SecurityEventType {
  TRUST_ESTABLISHED = "trust_established",
  TRUST_REVOKED = "trust_revoked",
  VERIFICATION_FAILED = "verification_failed",
  CONSTRAINT_VIOLATED = "constraint_violated",
  SIGNATURE_INVALID = "signature_invalid",
  DELEGATION_CREATED = "delegation_created",
  DELEGATION_REVOKED = "delegation_revoked",
  KEY_ROTATED = "key_rotated",
}

/**
 * Security event severity
 */
export enum SecurityEventSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  event_type: SecurityEventType;
  severity: SecurityEventSeverity;
  agent_id: string | null;
  description: string;
  timestamp: string; // ISO 8601 datetime
  metadata: Record<string, any>;
}

// ============================================================================
// ESA (Enterprise Security Authority) Types (Week 12)
// ============================================================================

/**
 * Enforcement mode for ESA
 */
export enum EnforcementMode {
  AUDIT_ONLY = "audit_only",
  ENFORCE = "enforce",
}

/**
 * ESA health status
 */
export enum ESAHealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  OFFLINE = "offline",
}

/**
 * ESA configuration
 */
export interface ESAConfig {
  id: string;
  agent_id: string;
  enforcement_mode: EnforcementMode;
  authority_id: string;
  default_capabilities: string[];
  system_constraints: string[];
  is_active: boolean;
  health_status: ESAHealthStatus;
  last_check_at: string | null; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

/**
 * ESA connection test result
 */
export interface ESAConnectionTestResult {
  success: boolean;
  latency?: number;
  message: string;
  error?: string;
}

// ============================================================================
// UI-Specific Types
// ============================================================================

/**
 * Trust chain list item for UI display
 */
export interface TrustChainListItem {
  agent_id: string;
  agent_name: string;
  authority_name: string;
  status: TrustStatus;
  capabilities_count: number;
  delegations_count: number;
  created_at: string; // ISO 8601 datetime
  expires_at: string | null; // ISO 8601 datetime
}

/**
 * Trust chain detail for UI display
 */
export interface TrustChainDetail extends TrustChain {
  agent_name: string;
  authority_name: string;
  status: TrustStatus;
  verification_history: VerificationResult[];
}

/**
 * Trust verification history item
 */
export interface VerificationHistoryItem {
  id: string;
  agent_id: string;
  action: string;
  resource: string | null;
  result: VerificationResult;
  timestamp: string; // ISO 8601 datetime
}

/**
 * Trust dashboard statistics
 */
export interface TrustDashboardStats {
  total_agents: number;
  active_agents: number;
  expired_agents: number;
  revoked_agents: number;
  total_verifications_24h: number;
  failed_verifications_24h: number;
  total_delegations: number;
  active_delegations: number;
}

// ============================================================================
// Agent Card Integration Types (Phase 4 - A2A)
// ============================================================================

/**
 * Agent trust summary for agent card display
 */
export interface AgentTrustSummary {
  agentId: string;
  agentName?: string;
  status: TrustStatus;
  authorityName: string;
  authorityType: AuthorityType;
  capabilityCount: number;
  constraintCount: number;
  expiresAt: string | null; // ISO 8601 datetime
  isExpiringSoon: boolean;
  verifiedAt: string | null; // ISO 8601 datetime
}

/**
 * Agent capability summary for agent card display
 */
export interface AgentCapabilitySummary {
  type: CapabilityType;
  name: string;
  constraintCount: number;
  isExpired: boolean;
}

// ============================================================================
// Trust Metrics Types (Phase 4 - Analytics Dashboard)
// ============================================================================

/**
 * Time range for metrics queries
 */
export interface TimeRange {
  start: Date;
  end: Date;
  preset?: "24h" | "7d" | "30d" | "90d" | "custom";
}

/**
 * Metrics summary for dashboard
 */
export interface MetricsSummary {
  totalEstablishments: number;
  establishmentsTrend: number;
  activeDelegations: number;
  delegationsTrend: number;
  verificationSuccessRate: number;
  successRateTrend: number;
  totalAuditEvents: number;
  auditEventsTrend: number;
}

/**
 * Activity data point for time series charts
 */
export interface ActivityDataPoint {
  date: string;
  establishments: number;
  delegations: number;
  revocations: number;
  verifications: number;
}

/**
 * Distribution item for pie/donut charts
 */
export interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
}

/**
 * Capability usage statistics
 */
export interface CapabilityUsage {
  capability: string;
  count: number;
  percentage: number;
}

/**
 * Violation data point for constraint violations
 */
export interface ViolationDataPoint {
  date: string;
  resourceLimit: number;
  timeWindow: number;
  dataScope: number;
  actionRestriction: number;
  auditRequirement: number;
}

/**
 * Complete trust metrics data structure
 */
export interface TrustMetrics {
  timeRange: TimeRange;
  summary: MetricsSummary;
  activityOverTime: ActivityDataPoint[];
  delegationDistribution: DistributionItem[];
  topCapabilities: CapabilityUsage[];
  constraintViolations: ViolationDataPoint[];
}

// ============================================================================
// Pipeline Integration Types (Phase 4)
// ============================================================================

/**
 * Overall trust status for a pipeline
 */
export interface PipelineTrustStatus {
  pipelineId: string;
  isReady: boolean;
  totalAgents: number;
  trustedAgents: number;
  untrustedAgents: number;
  expiredAgents: number;
  agentStatuses: AgentPipelineStatus[];
}

/**
 * Trust status for a single agent within a pipeline
 */
export interface AgentPipelineStatus {
  agentId: string;
  agentName: string;
  nodeId: string; // Pipeline node ID
  trustStatus: TrustStatus;
  requiredCapabilities: string[];
  availableCapabilities: string[];
  missingCapabilities: string[];
  constraintViolations: string[];
  isValid: boolean;
}

/**
 * Input for validating trust across a pipeline
 */
export interface TrustValidationInput {
  pipelineId: string;
  agentIds: string[];
  requiredCapabilities: Record<string, string[]>; // agentId -> capabilities
}

// ============================================================================
// Agent Card Component Types (Phase 4 - A2A Agent Cards)
// ============================================================================

/**
 * Agent with trust information for agent card display
 */
export interface AgentWithTrust {
  id: string;
  name: string;
  trust_status: TrustStatus;
  trust_chain_id?: string;
  capabilities: string[];
  constraints: string[];
  protocols: string[];
  endpoints: Array<{ name: string; url: string }>;
  established_by?: string;
  expires_at?: string;
}

/**
 * Filters for trust-aware agent search
 */
export interface AgentSearchFilters {
  query: string;
  trust_status?: TrustStatus[];
  capabilities?: string[];
  has_constraints?: boolean;
  sort_by?: "name" | "trust_expiration" | "capability_count";
  sort_order?: "asc" | "desc";
}
