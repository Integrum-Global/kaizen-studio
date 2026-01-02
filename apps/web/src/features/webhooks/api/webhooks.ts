import apiClient from "@/api";
import type {
  Webhook,
  WebhookWithSecret,
  WebhookDelivery,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookRequest,
  TestWebhookResponse,
  WebhookEventsResponse,
  WebhookFilters,
} from "../types";

/**
 * Webhook API client
 */
export const webhooksApi = {
  /**
   * Get all webhooks with optional filters
   */
  getAll: async (filters?: WebhookFilters): Promise<Webhook[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page)
      params.append(
        "offset",
        ((filters.page - 1) * (filters.page_size || 50)).toString()
      );
    if (filters?.page_size)
      params.append("limit", filters.page_size.toString());

    const response = await apiClient.get<Webhook[]>(
      `/api/v1/webhooks?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get webhook by ID
   */
  getById: async (id: string): Promise<Webhook> => {
    const response = await apiClient.get<Webhook>(`/api/v1/webhooks/${id}`);
    return response.data;
  },

  /**
   * Create a new webhook
   */
  create: async (input: CreateWebhookRequest): Promise<WebhookWithSecret> => {
    const response = await apiClient.post<WebhookWithSecret>(
      "/api/v1/webhooks",
      input
    );
    return response.data;
  },

  /**
   * Update webhook
   */
  update: async (id: string, input: UpdateWebhookRequest): Promise<Webhook> => {
    const response = await apiClient.put<Webhook>(
      `/api/v1/webhooks/${id}`,
      input
    );
    return response.data;
  },

  /**
   * Delete a webhook
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/webhooks/${id}`);
  },

  /**
   * Test webhook
   */
  test: async (
    id: string,
    data?: TestWebhookRequest
  ): Promise<TestWebhookResponse> => {
    const response = await apiClient.post<TestWebhookResponse>(
      `/api/v1/webhooks/${id}/test`,
      data || {}
    );
    return response.data;
  },

  /**
   * Get available webhook events
   */
  getEvents: async (): Promise<WebhookEventsResponse> => {
    const response = await apiClient.get<WebhookEventsResponse>(
      "/api/v1/webhooks/events"
    );
    return response.data;
  },

  /**
   * Get delivery history for a webhook
   */
  getDeliveries: async (
    webhookId: string,
    limit: number = 50
  ): Promise<WebhookDelivery[]> => {
    const response = await apiClient.get<WebhookDelivery[]>(
      `/api/v1/webhooks/${webhookId}/deliveries?limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get a specific delivery
   */
  getDelivery: async (deliveryId: string): Promise<WebhookDelivery> => {
    const response = await apiClient.get<WebhookDelivery>(
      `/api/v1/webhooks/deliveries/${deliveryId}`
    );
    return response.data;
  },

  /**
   * Retry a failed delivery
   */
  retryDelivery: async (deliveryId: string): Promise<WebhookDelivery> => {
    const response = await apiClient.post<WebhookDelivery>(
      `/api/v1/webhooks/deliveries/${deliveryId}/retry`
    );
    return response.data;
  },
};

export default webhooksApi;
