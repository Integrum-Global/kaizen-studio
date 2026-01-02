/**
 * Trust API Client
 *
 * API client functions for EATP operations:
 * - ESTABLISH: Create initial trust
 * - VERIFY: Validate trust for actions
 * - DELEGATE: Transfer trust between agents
 * - AUDIT: Record agent actions
 */

import { apiClient } from "@/api";
import type {
  TrustChain,
  EstablishTrustRequest,
  VerifyTrustRequest,
  VerificationResult,
  DelegateTrustRequest,
  DelegationRecord,
  AuditActionRequest,
  AuditAnchor,
  RevokeTrustRequest,
  RevokeDelegationRequest,
  AuditQuery,
  ComplianceReport,
  AgentMetadata,
  RegistrationRequest,
  DiscoveryQuery,
  OrganizationalAuthority,
} from "../types";

// Use shared apiClient for consistent auth handling and base URL
const trustApi = {
  get: (url: string, config?: Parameters<typeof apiClient.get>[1]) =>
    apiClient.get(`/api/v1/trust${url}`, config),
  post: (url: string, data?: unknown, config?: Parameters<typeof apiClient.post>[2]) =>
    apiClient.post(`/api/v1/trust${url}`, data, config),
  put: (url: string, data?: unknown, config?: Parameters<typeof apiClient.put>[2]) =>
    apiClient.put(`/api/v1/trust${url}`, data, config),
  patch: (url: string, data?: unknown, config?: Parameters<typeof apiClient.patch>[2]) =>
    apiClient.patch(`/api/v1/trust${url}`, data, config),
  delete: (url: string, config?: Parameters<typeof apiClient.delete>[1]) =>
    apiClient.delete(`/api/v1/trust${url}`, config),
};

// ============================================================================
// Core EATP Operations
// ============================================================================

/**
 * ESTABLISH: Create initial trust for an agent
 */
export async function establishTrust(
  request: EstablishTrustRequest
): Promise<TrustChain> {
  const response = await trustApi.post("/establish", request);
  return response.data;
}

/**
 * VERIFY: Check if agent has trust to perform action
 */
export async function verifyTrust(
  request: VerifyTrustRequest
): Promise<VerificationResult> {
  const response = await trustApi.post("/verify", request);
  return response.data;
}

/**
 * DELEGATE: Transfer trust from one agent to another
 */
export async function delegateTrust(
  request: DelegateTrustRequest
): Promise<DelegationRecord> {
  const response = await trustApi.post("/delegate", request);
  return response.data;
}

/**
 * AUDIT: Record an agent action
 */
export async function auditAction(
  request: AuditActionRequest
): Promise<AuditAnchor> {
  const response = await trustApi.post("/audit", request);
  return response.data;
}

// ============================================================================
// Trust Chain Management
// ============================================================================

/**
 * Get trust chain for an agent
 */
export async function getTrustChain(agentId: string): Promise<TrustChain> {
  const response = await trustApi.get(`/chains/${agentId}`);
  return response.data;
}

/**
 * Get all trust chains
 */
export async function listTrustChains(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<{ items: TrustChain[]; total: number }> {
  const response = await trustApi.get("/chains", { params });
  return response.data;
}

/**
 * Revoke trust for an agent
 */
export async function revokeTrust(request: RevokeTrustRequest): Promise<void> {
  await trustApi.post("/revoke", request);
}

/**
 * Revoke a delegation
 */
export async function revokeDelegation(
  request: RevokeDelegationRequest
): Promise<void> {
  await trustApi.post("/revoke-delegation", request);
}

/**
 * Get agent capabilities
 */
export async function getAgentCapabilities(agentId: string): Promise<string[]> {
  const response = await trustApi.get(`/agents/${agentId}/capabilities`);
  return response.data;
}

/**
 * Get agent constraints
 */
export async function getAgentConstraints(agentId: string): Promise<string[]> {
  const response = await trustApi.get(`/agents/${agentId}/constraints`);
  return response.data;
}

// ============================================================================
// Audit Operations
// ============================================================================

/**
 * Query audit trail
 */
export async function queryAuditTrail(
  query: AuditQuery
): Promise<{ items: AuditAnchor[]; total: number }> {
  const response = await trustApi.get("/audit", { params: query });
  return response.data;
}

/**
 * Get compliance report
 */
export async function getComplianceReport(
  organizationId: string,
  startTime: string,
  endTime: string
): Promise<ComplianceReport> {
  const response = await trustApi.get(`/compliance/${organizationId}`, {
    params: { start_time: startTime, end_time: endTime },
  });
  return response.data;
}

// ============================================================================
// Agent Registry Operations
// ============================================================================

/**
 * Register an agent
 */
export async function registerAgent(
  request: RegistrationRequest
): Promise<AgentMetadata> {
  const response = await trustApi.post("/registry/agents", request);
  return response.data;
}

/**
 * Discover agents by capabilities/tags
 */
export async function discoverAgents(
  query: DiscoveryQuery
): Promise<AgentMetadata[]> {
  const response = await trustApi.post("/registry/discover", query);
  return response.data;
}

/**
 * Get agent metadata
 */
export async function getAgentMetadata(
  agentId: string
): Promise<AgentMetadata> {
  const response = await trustApi.get(`/registry/agents/${agentId}`);
  return response.data;
}

/**
 * Update agent heartbeat
 */
export async function updateAgentHeartbeat(agentId: string): Promise<void> {
  await trustApi.post(`/registry/agents/${agentId}/heartbeat`);
}

// ============================================================================
// Authority Management
// ============================================================================

/**
 * Get organizational authority
 */
export async function getAuthority(
  authorityId: string
): Promise<OrganizationalAuthority> {
  const response = await trustApi.get(`/authorities/${authorityId}`);
  return response.data;
}

/**
 * List all authorities
 */
export async function listAuthorities(): Promise<OrganizationalAuthority[]> {
  const response = await trustApi.get("/authorities");
  return response.data;
}

/**
 * Get authorities with filters (UI-focused)
 */
export async function getAuthorities(
  filters?: import("../types").AuthorityFilters
): Promise<import("../types").Authority[]> {
  const response = await trustApi.get("/authorities/ui", { params: filters });
  return response.data;
}

/**
 * Get authority by ID (UI-focused)
 */
export async function getAuthorityById(
  id: string
): Promise<import("../types").Authority> {
  const response = await trustApi.get(`/authorities/ui/${id}`);
  return response.data;
}

/**
 * Create a new authority
 */
export async function createAuthority(
  input: import("../types").CreateAuthorityInput
): Promise<import("../types").Authority> {
  const response = await trustApi.post("/authorities", input);
  return response.data;
}

/**
 * Update an authority
 */
export async function updateAuthority(
  id: string,
  input: import("../types").UpdateAuthorityInput
): Promise<import("../types").Authority> {
  const response = await trustApi.patch(`/authorities/${id}`, input);
  return response.data;
}

/**
 * Deactivate an authority
 */
export async function deactivateAuthority(
  id: string,
  reason: string
): Promise<import("../types").Authority> {
  const response = await trustApi.post(`/authorities/${id}/deactivate`, {
    reason,
  });
  return response.data;
}

/**
 * Get agents established by an authority
 */
export async function getAuthorityAgents(
  id: string
): Promise<import("../types").AgentMetadata[]> {
  const response = await trustApi.get(`/authorities/${id}/agents`);
  return response.data;
}

// ============================================================================
// ESA (Enterprise Security Authority) Operations
// ============================================================================

/**
 * Get ESA configuration
 */
export async function getESAConfig(): Promise<import("../types").ESAConfig> {
  const response = await trustApi.get("/esa/config");
  return response.data;
}

/**
 * Update ESA configuration
 */
export async function updateESAConfig(
  config: Partial<import("../types").ESAConfig>
): Promise<import("../types").ESAConfig> {
  const response = await trustApi.put("/esa/config", config);
  return response.data;
}

/**
 * Test ESA connection
 */
export async function testESAConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await trustApi.post("/esa/test-connection");
  return response.data;
}

// ============================================================================
// Agent Card Integration (Phase 4 - A2A)
// ============================================================================

/**
 * Get agent trust summary for agent card display
 */
export async function getAgentTrustSummary(
  agentId: string
): Promise<import("../types").AgentTrustSummary> {
  const response = await trustApi.get(`/agents/${agentId}/trust-summary`);
  return response.data;
}

/**
 * Get agent capability summary for agent card display
 */
export async function getAgentCapabilitySummary(
  agentId: string
): Promise<import("../types").AgentCapabilitySummary[]> {
  const response = await trustApi.get(`/agents/${agentId}/capability-summary`);
  return response.data;
}

// ============================================================================
// Trust Metrics Operations (Phase 4 - Analytics Dashboard)
// ============================================================================

/**
 * Get trust metrics for a time range
 */
export async function getTrustMetrics(
  timeRange: import("../types").TimeRange
): Promise<import("../types").TrustMetrics> {
  const response = await trustApi.get("/metrics", {
    params: {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      preset: timeRange.preset,
    },
  });
  return response.data;
}

/**
 * Export metrics in specified format
 */
export async function exportMetrics(
  timeRange: import("../types").TimeRange,
  format: "csv" | "json"
): Promise<Blob> {
  const response = await trustApi.get("/metrics/export", {
    params: {
      start: timeRange.start.toISOString(),
      end: timeRange.end.toISOString(),
      preset: timeRange.preset,
      format,
    },
    responseType: "blob",
  });
  return response.data;
}

// ============================================================================
// Pipeline Integration Operations (Phase 4 - Pipeline Trust)
// ============================================================================

/**
 * Validate trust for all agents in a pipeline
 */
export async function validatePipelineTrust(
  input: import("../types").TrustValidationInput
): Promise<import("../types").PipelineTrustStatus> {
  const response = await trustApi.post("/pipeline/validate", input);
  return response.data;
}

/**
 * Get agent trust status for a specific pipeline
 */
export async function getAgentTrustForPipeline(
  agentId: string,
  pipelineId: string
): Promise<import("../types").AgentPipelineStatus> {
  const response = await trustApi.get(
    `/pipeline/${pipelineId}/agents/${agentId}`
  );
  return response.data;
}

export default trustApi;
