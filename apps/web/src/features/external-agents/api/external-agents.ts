import apiClient from "@/api";
import type {
  ExternalAgent,
  ExternalAgentInvocation,
  GovernanceStatus,
  LineageGraph,
  CreateExternalAgentRequest,
  UpdateExternalAgentRequest,
  InvokeExternalAgentRequest,
  ExternalAgentFilters,
} from "../types";

/**
 * External Agents API client
 */
export const externalAgentsApi = {
  /**
   * Get all external agents with optional filters
   */
  getAll: async (filters?: ExternalAgentFilters): Promise<ExternalAgent[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.provider) params.append("provider", filters.provider);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page)
      params.append(
        "offset",
        ((filters.page - 1) * (filters.page_size || 50)).toString()
      );
    if (filters?.page_size)
      params.append("limit", filters.page_size.toString());

    const response = await apiClient.get<ExternalAgent[]>(
      `/api/v1/external-agents?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get external agent by ID
   */
  getById: async (id: string): Promise<ExternalAgent> => {
    const response = await apiClient.get<ExternalAgent>(
      `/api/v1/external-agents/${id}`
    );
    return response.data;
  },

  /**
   * Create a new external agent
   */
  create: async (
    input: CreateExternalAgentRequest
  ): Promise<ExternalAgent> => {
    const response = await apiClient.post<ExternalAgent>(
      "/api/v1/external-agents",
      input
    );
    return response.data;
  },

  /**
   * Update external agent
   */
  update: async (
    id: string,
    input: UpdateExternalAgentRequest
  ): Promise<ExternalAgent> => {
    const response = await apiClient.patch<ExternalAgent>(
      `/api/v1/external-agents/${id}`,
      input
    );
    return response.data;
  },

  /**
   * Delete an external agent
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/external-agents/${id}`);
  },

  /**
   * Invoke an external agent
   */
  invoke: async (
    id: string,
    input: InvokeExternalAgentRequest
  ): Promise<ExternalAgentInvocation> => {
    const response = await apiClient.post<ExternalAgentInvocation>(
      `/api/v1/external-agents/${id}/invoke`,
      input
    );
    return response.data;
  },

  /**
   * Get invocations for an external agent
   */
  getInvocations: async (
    agentId: string,
    limit: number = 50
  ): Promise<ExternalAgentInvocation[]> => {
    const response = await apiClient.get<ExternalAgentInvocation[]>(
      `/api/v1/external-agents/${agentId}/invocations?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get governance status for an external agent
   */
  getGovernanceStatus: async (
    agentId: string
  ): Promise<GovernanceStatus> => {
    const response = await apiClient.get<GovernanceStatus>(
      `/api/v1/external-agents/${agentId}/governance-status`
    );
    return response.data;
  },

  /**
   * Get lineage graph for an external agent
   */
  getLineageGraph: async (agentId: string): Promise<LineageGraph> => {
    const response = await apiClient.get<LineageGraph>(
      `/api/v1/lineage/graph?agent_id=${agentId}`
    );
    return response.data;
  },
};

export default externalAgentsApi;
