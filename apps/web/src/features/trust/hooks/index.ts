/**
 * Trust Hooks
 *
 * React Query hooks for EATP operations
 */

// Export authority-specific hooks
export * from "./authority";

// Export ESA hooks
export * from "./esa";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  EstablishTrustRequest,
  VerifyTrustRequest,
  DelegateTrustRequest,
  AuditActionRequest,
  RevokeTrustRequest,
  RevokeDelegationRequest,
  AuditQuery,
  RegistrationRequest,
  DiscoveryQuery,
} from "../types";
import * as trustApi from "../api";

// ============================================================================
// Trust Chain Queries
// ============================================================================

/**
 * Hook to get trust chain for an agent
 */
export function useTrustChain(agentId: string) {
  return useQuery({
    queryKey: ["trustChain", agentId],
    queryFn: () => trustApi.getTrustChain(agentId),
    enabled: !!agentId,
  });
}

/**
 * Hook to list all trust chains
 */
export function useTrustChains(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ["trustChains", params],
    queryFn: () => trustApi.listTrustChains(params),
  });
}

/**
 * Hook to get agent capabilities
 */
export function useAgentCapabilities(agentId: string) {
  return useQuery({
    queryKey: ["agentCapabilities", agentId],
    queryFn: () => trustApi.getAgentCapabilities(agentId),
    enabled: !!agentId,
  });
}

/**
 * Hook to get agent constraints
 */
export function useAgentConstraints(agentId: string) {
  return useQuery({
    queryKey: ["agentConstraints", agentId],
    queryFn: () => trustApi.getAgentConstraints(agentId),
    enabled: !!agentId,
  });
}

// ============================================================================
// Trust Operations Mutations
// ============================================================================

/**
 * Hook to establish trust for an agent
 */
export function useEstablishTrust() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: EstablishTrustRequest) =>
      trustApi.establishTrust(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trustChains"] });
      queryClient.setQueryData(["trustChain", data.genesis.agent_id], data);
    },
  });
}

/**
 * Hook to verify trust for an action
 */
export function useVerifyTrust() {
  return useMutation({
    mutationFn: (request: VerifyTrustRequest) => trustApi.verifyTrust(request),
  });
}

/**
 * Hook to delegate trust between agents
 */
export function useDelegateTrust() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DelegateTrustRequest) =>
      trustApi.delegateTrust(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["trustChain", data.delegatee_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["trustChain", data.delegator_id],
      });
    },
  });
}

/**
 * Hook to audit an action
 */
export function useAuditAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AuditActionRequest) => trustApi.auditAction(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auditTrail"] });
    },
  });
}

/**
 * Hook to revoke trust
 */
export function useRevokeTrust() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RevokeTrustRequest) => trustApi.revokeTrust(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trustChains"] });
      queryClient.invalidateQueries({
        queryKey: ["trustChain", variables.agent_id],
      });
    },
  });
}

/**
 * Hook to revoke delegation
 */
export function useRevokeDelegation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RevokeDelegationRequest) =>
      trustApi.revokeDelegation(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["trustChain", variables.delegatee_id],
      });
    },
  });
}

// ============================================================================
// Audit Queries
// ============================================================================

/**
 * Hook to query audit trail
 */
export function useAuditTrail(query: AuditQuery) {
  return useQuery({
    queryKey: ["auditTrail", query],
    queryFn: () => trustApi.queryAuditTrail(query),
  });
}

/**
 * Hook to get compliance report
 */
export function useComplianceReport(
  organizationId: string,
  startTime: string,
  endTime: string
) {
  return useQuery({
    queryKey: ["complianceReport", organizationId, startTime, endTime],
    queryFn: () =>
      trustApi.getComplianceReport(organizationId, startTime, endTime),
    enabled: !!organizationId && !!startTime && !!endTime,
  });
}

// ============================================================================
// Agent Registry Queries
// ============================================================================

/**
 * Hook to get agent metadata
 */
export function useAgentMetadata(agentId: string) {
  return useQuery({
    queryKey: ["agentMetadata", agentId],
    queryFn: () => trustApi.getAgentMetadata(agentId),
    enabled: !!agentId,
  });
}

/**
 * Hook to discover agents
 */
export function useDiscoverAgents(query: DiscoveryQuery) {
  return useQuery({
    queryKey: ["discoverAgents", query],
    queryFn: () => trustApi.discoverAgents(query),
  });
}

/**
 * Hook to register an agent
 */
export function useRegisterAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: RegistrationRequest) =>
      trustApi.registerAgent(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["discoverAgents"] });
      queryClient.setQueryData(["agentMetadata", data.agent_id], data);
    },
  });
}

/**
 * Hook to update agent heartbeat
 */
export function useUpdateAgentHeartbeat() {
  return useMutation({
    mutationFn: (agentId: string) => trustApi.updateAgentHeartbeat(agentId),
  });
}

// ============================================================================
// Authority Queries
// ============================================================================

/**
 * Hook to get authority
 */
export function useAuthority(authorityId: string) {
  return useQuery({
    queryKey: ["authority", authorityId],
    queryFn: () => trustApi.getAuthority(authorityId),
    enabled: !!authorityId,
  });
}

/**
 * Hook to list authorities
 */
export function useAuthorities() {
  return useQuery({
    queryKey: ["authorities"],
    queryFn: () => trustApi.listAuthorities(),
  });
}

// ============================================================================
// ESA Queries
// ============================================================================

/**
 * Hook to get ESA configuration
 */
export function useESAConfig() {
  return useQuery({
    queryKey: ["esaConfig"],
    queryFn: () => trustApi.getESAConfig(),
  });
}

/**
 * Hook to update ESA configuration
 */
export function useUpdateESAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<import("../types").ESAConfig>) =>
      trustApi.updateESAConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(["esaConfig"], data);
      queryClient.invalidateQueries({ queryKey: ["esaConfig"] });
    },
  });
}

/**
 * Hook to test ESA connection
 */
export function useTestESAConnection() {
  return useMutation({
    mutationFn: () => trustApi.testESAConnection(),
  });
}

// ============================================================================
// Agent Card Integration Hooks (Phase 4 - A2A)
// ============================================================================

/**
 * Hook to get agent trust summary for agent card display
 */
export function useAgentTrustSummary(agentId: string) {
  return useQuery({
    queryKey: ["agentTrustSummary", agentId],
    queryFn: () => trustApi.getAgentTrustSummary(agentId),
    enabled: !!agentId,
  });
}

/**
 * Hook to get agent capability summary for agent card display
 */
export function useAgentCapabilitySummary(agentId: string) {
  return useQuery({
    queryKey: ["agentCapabilitySummary", agentId],
    queryFn: () => trustApi.getAgentCapabilitySummary(agentId),
    enabled: !!agentId,
  });
}

// ============================================================================
// Dashboard Queries
// ============================================================================

/**
 * Hook to get trust dashboard statistics
 */
export function useTrustDashboardStats() {
  return useQuery({
    queryKey: ["trustDashboardStats"],
    queryFn: async () => {
      // For now, we'll derive stats from the trust chains list
      // In production, this should be a dedicated API endpoint
      const chainsResponse = await trustApi.listTrustChains({
        page_size: 1000,
      });
      const auditResponse = await trustApi.queryAuditTrail({
        page_size: 10,
      });

      const chains = chainsResponse.items;
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Calculate stats
      const totalAgents = chains.length;
      const activeAgents = chains.filter(
        (chain) =>
          !chain.genesis.expires_at || new Date(chain.genesis.expires_at) > now
      ).length;
      const expiredAgents = chains.filter(
        (chain) =>
          chain.genesis.expires_at && new Date(chain.genesis.expires_at) <= now
      ).length;

      const totalDelegations = chains.reduce(
        (sum, chain) => sum + chain.delegations.length,
        0
      );
      const activeDelegations = chains.reduce((sum, chain) => {
        return (
          sum +
          chain.delegations.filter(
            (del) => !del.expires_at || new Date(del.expires_at) > now
          ).length
        );
      }, 0);

      const recentAudits = auditResponse.items.filter(
        (audit) => new Date(audit.timestamp) >= yesterday
      );
      const totalVerifications24h = recentAudits.length;
      const failedVerifications24h = recentAudits.filter(
        (audit) => audit.result === "denied" || audit.result === "failure"
      ).length;

      return {
        total_agents: totalAgents,
        active_agents: activeAgents,
        expired_agents: expiredAgents,
        revoked_agents: 0, // Would need revocation tracking
        total_verifications_24h: totalVerifications24h,
        failed_verifications_24h: failedVerifications24h,
        total_delegations: totalDelegations,
        active_delegations: activeDelegations,
        recent_audits: auditResponse.items.slice(0, 10),
      };
    },
  });
}

// ============================================================================
// Trust Metrics Hooks (Phase 4 - Analytics Dashboard)
// ============================================================================

/**
 * Hook to get trust metrics for a time range
 */
export function useTrustMetrics(timeRange: import("../types").TimeRange) {
  return useQuery({
    queryKey: ["trustMetrics", timeRange],
    queryFn: () => trustApi.getTrustMetrics(timeRange),
    enabled: !!timeRange.start && !!timeRange.end,
  });
}

/**
 * Hook to export metrics
 */
export function useExportMetrics() {
  return useMutation({
    mutationFn: (params: {
      timeRange: import("../types").TimeRange;
      format: "csv" | "json";
    }) => trustApi.exportMetrics(params.timeRange, params.format),
  });
}

// ============================================================================
// Pipeline Integration Hooks (Phase 4 - Pipeline Trust)
// ============================================================================

/**
 * Hook to validate trust for all agents in a pipeline
 */
export function usePipelineTrustValidation(
  pipelineId: string,
  agentIds: string[],
  requiredCapabilities: Record<string, string[]> = {}
) {
  return useQuery({
    queryKey: ["pipelineTrustValidation", pipelineId, agentIds],
    queryFn: () =>
      trustApi.validatePipelineTrust({
        pipelineId,
        agentIds,
        requiredCapabilities,
      }),
    enabled: !!pipelineId && agentIds.length > 0,
  });
}

/**
 * Hook to get agent trust status for a specific pipeline
 */
export function useAgentPipelineStatus(agentId: string, pipelineId: string) {
  return useQuery({
    queryKey: ["agentPipelineStatus", agentId, pipelineId],
    queryFn: () => trustApi.getAgentTrustForPipeline(agentId, pipelineId),
    enabled: !!agentId && !!pipelineId,
  });
}

// ============================================================================
// EATP Cascade Revocation Hooks
// ============================================================================

/**
 * Hook to get revocation impact preview
 *
 * Shows all agents that will be affected when revoking with cascade.
 */
export function useRevocationImpact(agentId: string) {
  return useQuery({
    queryKey: ["revocationImpact", agentId],
    queryFn: () => trustApi.getRevocationImpact(agentId),
    enabled: !!agentId,
  });
}

/**
 * Hook to revoke trust with cascade
 *
 * EATP Operation: Revokes target and ALL downstream agents.
 */
export function useRevokeCascade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, reason }: { agentId: string; reason: string }) =>
      trustApi.revokeCascade(agentId, reason),
    onSuccess: (data) => {
      // Invalidate all affected trust chains
      data.revokedAgentIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ["trustChain", id] });
      });
      queryClient.invalidateQueries({ queryKey: ["trustChains"] });
      queryClient.invalidateQueries({ queryKey: ["revocationImpact"] });
    },
  });
}

/**
 * Hook to revoke all delegations from a specific human
 *
 * EATP Operation: When a human's access is revoked (e.g., employee leaves),
 * ALL agents they delegated to must be revoked.
 */
export function useRevokeByHuman() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ humanId, reason }: { humanId: string; reason: string }) =>
      trustApi.revokeByHuman(humanId, reason),
    onSuccess: (data) => {
      // Invalidate all affected trust chains
      data.revokedAgentIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ["trustChain", id] });
      });
      queryClient.invalidateQueries({ queryKey: ["trustChains"] });
      queryClient.invalidateQueries({ queryKey: ["auditByHumanOrigin"] });
    },
  });
}

/**
 * Hook to query audit trail by human origin
 *
 * EATP: Query all actions ultimately authorized by a specific human.
 */
export function useAuditByHumanOrigin(
  humanId: string,
  params?: {
    start_time?: string;
    end_time?: string;
    action?: string;
    result?: import("../types").ActionResult;
    page?: number;
    page_size?: number;
  }
) {
  return useQuery({
    queryKey: ["auditByHumanOrigin", humanId, params],
    queryFn: () => trustApi.queryAuditByHumanOrigin(humanId, params),
    enabled: !!humanId,
  });
}
