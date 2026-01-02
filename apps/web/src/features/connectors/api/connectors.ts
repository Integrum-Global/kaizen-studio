import apiClient from "@/api";
import type {
  Connector,
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorFilters,
  ConnectorResponse,
  TestResultResponse,
} from "../types";

/**
 * Connector API client
 */
export const connectorsApi = {
  /**
   * Get all connectors with optional filters
   */
  getAll: async (filters?: ConnectorFilters): Promise<ConnectorResponse> => {
    const params = new URLSearchParams();
    // organization_id is required by the backend
    if (filters?.organization_id)
      params.append("organization_id", filters.organization_id);
    if (filters?.connector_type)
      params.append("connector_type", filters.connector_type);
    if (filters?.provider) params.append("provider", filters.provider);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page)
      params.append(
        "offset",
        ((filters.page - 1) * (filters.page_size || 50)).toString()
      );
    if (filters?.page_size)
      params.append("limit", filters.page_size.toString());

    const response = await apiClient.get<ConnectorResponse>(
      `/api/v1/connectors?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get connector by ID
   */
  getById: async (id: string): Promise<Connector> => {
    const response = await apiClient.get<Connector>(`/api/v1/connectors/${id}`);
    return response.data;
  },

  /**
   * Create a new connector
   */
  create: async (input: CreateConnectorRequest): Promise<Connector> => {
    const response = await apiClient.post<Connector>(
      "/api/v1/connectors",
      input
    );
    return response.data;
  },

  /**
   * Update connector
   */
  update: async (
    id: string,
    input: UpdateConnectorRequest
  ): Promise<Connector> => {
    const response = await apiClient.put<Connector>(
      `/api/v1/connectors/${id}`,
      input
    );
    return response.data;
  },

  /**
   * Delete a connector
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/connectors/${id}`);
  },

  /**
   * Test connector connection
   */
  testConnection: async (id: string): Promise<TestResultResponse> => {
    const response = await apiClient.post<TestResultResponse>(
      `/api/v1/connectors/${id}/test`
    );
    return response.data;
  },
};

export default connectorsApi;
