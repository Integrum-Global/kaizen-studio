/**
 * Enterprise Agent Trust Protocol (EATP) Frontend Module
 *
 * This module provides a complete frontend implementation for the EATP trust system,
 * including types, API client, React hooks, and state management.
 *
 * Usage:
 *
 * ```typescript
 * // Import types
 * import type { TrustChain, VerificationResult } from '@/features/trust';
 *
 * // Use hooks
 * import { useTrustChain, useVerifyTrust } from '@/features/trust';
 *
 * function MyComponent() {
 *   const { data: chain } = useTrustChain('agent-123');
 *   const { mutate: verify } = useVerifyTrust();
 *
 *   return <div>...</div>;
 * }
 * ```
 */

// Export all types
export * from "./types";

// Export API client
export * as trustApi from "./api";

// Export hooks
export * from "./hooks";

// Export store
export { useTrustStore } from "./store/trust";

// Export components - Dashboard & Viewers
export { TrustDashboard } from "./components/TrustDashboard";
export { TrustStatusBadge } from "./components/TrustStatusBadge";
export { HumanOriginBadge } from "./components/HumanOriginBadge";
export { CascadeRevocationModal } from "./components/CascadeRevocationModal";
export { TrustChainViewer } from "./components/TrustChainViewer";

// Export components - Trust Management (Phase 2)
export {
  EstablishTrustForm,
  CapabilityEditor,
  ConstraintEditor,
  AuthoritySelector,
  DelegationWizard,
  RevokeTrustDialog,
} from "./components/TrustManagement";

// Export components - Audit Trail & Visualization (Phase 3)
export {
  AuditTrailViewer,
  AuditEventCard,
  AuditFilters,
  AuditExport,
  DelegationTimeline,
} from "./components/AuditTrail";

export {
  TrustChainGraph,
  AuthorityNode,
  AgentNode,
  DelegationEdge,
} from "./components/TrustChainGraph";

// Export components - Authority Management (Phase 4)
export {
  AuthorityManager,
  AuthorityCard,
  AuthorityDetailView,
  CreateAuthorityDialog,
  EditAuthorityDialog,
  DeactivateAuthorityDialog,
} from "./components/AuthorityManagement";

// Export components - ESA Configuration (Phase 4)
export { ESAConfigPanel, ESAStatusIndicator } from "./components/ESAConfig";

// Export components - Agent Card Integration (Phase 4 - A2A)
export {
  AgentCardTrustSection,
  AgentTrustPreview,
  TrustCapabilityList,
  AgentTrustActions,
  TrustBadgeWithTooltip,
} from "./components/AgentCardIntegration";

// Export components - Agent Card (Phase 4 - A2A Agent Cards)
export {
  AgentCardPreview,
  AgentTrustBadge,
  TrustAwareAgentSearch,
  AgentTrustSummary,
} from "./components/AgentCard";

// Export components - Trust Metrics (Phase 4 - Analytics Dashboard)
export {
  TrustMetricsDashboard,
  MetricCard,
  TrustActivityChart,
  DelegationDistributionChart,
  TopCapabilitiesChart,
  ConstraintViolationsChart,
} from "./components/TrustMetrics";

// Export components - Pipeline Trust (Phase 4)
export {
  TrustOverlay as PipelineTrustOverlay,
  PipelineTrustValidator,
  AgentTrustStatus,
  TrustValidationResult as PipelineTrustValidationResult,
  usePipelineTrustValidation,
  useAgentPipelineStatus,
  useBatchValidatePipelineAgents,
  useValidationCache,
} from "./components/PipelineTrust";

export type {
  PipelineAgent,
  TrustValidationResultData,
  PipelineTrustValidation,
} from "./components/PipelineTrust";

// Export schema types
export type {
  EstablishTrustFormData,
  CapabilityFormData,
  DelegationFormData,
  DelegatedCapabilityData,
} from "./components/TrustManagement";

export type { ESAConfigFormData } from "./components/ESAConfig";

// Export Phase 3 types
export type { AuditFilterValues } from "./components/AuditTrail";
export type { AuthorityNodeData } from "./components/TrustChainGraph";
export type { AgentNodeData } from "./components/TrustChainGraph";
export type { DelegationEdgeData } from "./components/TrustChainGraph";

// Re-export commonly used items for convenience
export {
  TrustStatus,
  VerificationLevel,
  AuthorityType,
  CapabilityType,
  ActionResult,
  ConstraintType,
  EnforcementMode,
  HealthStatus,
  AuthProvider,
} from "./types";

export type {
  TrustChain,
  GenesisRecord,
  CapabilityAttestation,
  DelegationRecord,
  ConstraintEnvelope,
  AuditAnchor,
  VerificationResult,
  ESAConfig,
  ESAConnectionTestResult,
  PipelineTrustStatus,
  AgentPipelineStatus,
  TrustValidationInput,
  AgentWithTrust,
  AgentSearchFilters,
  HumanOrigin,
  ExecutionContext,
  EATPDelegationRecord,
  EATPAuditAnchor,
  CascadeRevocationResult,
  RevocationImpactPreview,
  AffectedAgent,
  ConstraintTighteningResult,
  ConstraintTighteningViolation,
} from "./types";
