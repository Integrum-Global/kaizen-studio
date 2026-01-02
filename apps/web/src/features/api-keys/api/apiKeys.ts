import apiClient from "@/api";
import type {
  ApiKey,
  CreateApiKeyInput,
  ApiKeyFilters,
  ApiKeyResponse,
  NewApiKeyResponse,
} from "../types";

/**
 * API Keys API client
 */
export const apiKeysApi = {
  /**
   * Get all API keys with optional filters
   */
  getAll: async (filters?: ApiKeyFilters): Promise<ApiKeyResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.page_size)
      params.append("page_size", filters.page_size.toString());

    const response = await apiClient.get<ApiKeyResponse>(
      `/api/v1/api-keys?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get API key by ID
   */
  getById: async (id: string): Promise<ApiKey> => {
    const response = await apiClient.get<ApiKey>(`/api/v1/api-keys/${id}`);
    return response.data;
  },

  /**
   * Create a new API key
   */
  create: async (input: CreateApiKeyInput): Promise<NewApiKeyResponse> => {
    const response = await apiClient.post<NewApiKeyResponse>(
      "/api/v1/api-keys",
      input
    );
    return response.data;
  },

  /**
   * Revoke an API key
   */
  revoke: async (id: string): Promise<ApiKey> => {
    const response = await apiClient.post<ApiKey>(
      `/api/v1/api-keys/${id}/revoke`
    );
    return response.data;
  },

  /**
   * Regenerate an API key
   */
  regenerate: async (id: string): Promise<NewApiKeyResponse> => {
    const response = await apiClient.post<NewApiKeyResponse>(
      `/api/v1/api-keys/${id}/regenerate`
    );
    return response.data;
  },
};

export default apiKeysApi;
