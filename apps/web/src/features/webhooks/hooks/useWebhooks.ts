import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webhooksApi } from "../api";
import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  TestWebhookRequest,
  WebhookFilters,
} from "../types";
import { AxiosError } from "axios";
import queryKeys from "@/lib/queryKeys";

/**
 * Hook to get all webhooks with optional filters
 */
export function useWebhooks(filters?: WebhookFilters) {
  return useQuery({
    queryKey: queryKeys.webhooks.list(filters),
    queryFn: () => webhooksApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single webhook by ID
 */
export function useWebhook(id: string) {
  return useQuery({
    queryKey: queryKeys.webhooks.detail(id),
    queryFn: () => webhooksApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new webhook
 */
export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWebhookRequest) => webhooksApi.create(input),
    onSuccess: (newWebhook) => {
      // Invalidate webhooks list
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.lists() });
      // Set the new webhook in cache
      queryClient.setQueryData(
        queryKeys.webhooks.detail(newWebhook.id),
        newWebhook
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create webhook error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a webhook
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWebhookRequest }) =>
      webhooksApi.update(id, input),
    onSuccess: (updatedWebhook) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.lists() });
      // Update detail cache
      queryClient.setQueryData(
        queryKeys.webhooks.detail(updatedWebhook.id),
        updatedWebhook
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update webhook error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete a webhook
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => webhooksApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.webhooks.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete webhook error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to test a webhook
 */
export function useTestWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TestWebhookRequest }) =>
      webhooksApi.test(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate the webhook detail to refetch updated test results
      queryClient.invalidateQueries({
        queryKey: queryKeys.webhooks.detail(id),
      });
      // Also invalidate lists in case test status is displayed
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.lists() });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Test webhook error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to get available webhook events
 */
export function useWebhookEvents() {
  return useQuery({
    queryKey: ["webhookEvents"],
    queryFn: () => webhooksApi.getEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes (events rarely change)
  });
}

/**
 * Hook to get webhook deliveries
 */
export function useWebhookDeliveries(webhookId: string, limit?: number) {
  return useQuery({
    queryKey: ["webhookDeliveries", webhookId, limit],
    queryFn: () => webhooksApi.getDeliveries(webhookId, limit),
    enabled: !!webhookId,
    staleTime: 10 * 1000, // 10 seconds (delivery history changes frequently)
  });
}

/**
 * Hook to get a specific delivery
 */
export function useWebhookDelivery(deliveryId: string) {
  return useQuery({
    queryKey: ["webhookDelivery", deliveryId],
    queryFn: () => webhooksApi.getDelivery(deliveryId),
    enabled: !!deliveryId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to retry a failed delivery
 */
export function useRetryDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deliveryId: string) => webhooksApi.retryDelivery(deliveryId),
    onSuccess: (newDelivery) => {
      // Invalidate delivery lists for the webhook
      queryClient.invalidateQueries({
        queryKey: ["webhookDeliveries", newDelivery.webhook_id],
      });
      // Update the delivery in cache
      queryClient.setQueryData(
        ["webhookDelivery", newDelivery.id],
        newDelivery
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Retry delivery error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
