import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiKeysApi } from "../api";
import type { CreateApiKeyInput, ApiKeyFilters } from "../types";
import { AxiosError } from "axios";

/**
 * Query key factory for API keys
 */
export const apiKeyKeys = {
  all: ["apiKeys"] as const,
  lists: () => [...apiKeyKeys.all, "list"] as const,
  list: (filters?: ApiKeyFilters) => [...apiKeyKeys.lists(), filters] as const,
  details: () => [...apiKeyKeys.all, "detail"] as const,
  detail: (id: string) => [...apiKeyKeys.details(), id] as const,
};

/**
 * Hook to get all API keys with optional filters
 */
export function useApiKeys(filters?: ApiKeyFilters) {
  return useQuery({
    queryKey: apiKeyKeys.list(filters),
    queryFn: () => apiKeysApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single API key by ID
 */
export function useApiKey(id: string) {
  return useQuery({
    queryKey: apiKeyKeys.detail(id),
    queryFn: () => apiKeysApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => apiKeysApi.create(input),
    onSuccess: (newApiKeyResponse) => {
      // Invalidate API keys list
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      // Set the new API key in cache
      queryClient.setQueryData(
        apiKeyKeys.detail(newApiKeyResponse.key.id),
        newApiKeyResponse.key
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create API key error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to revoke an API key
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: (revokedKey) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(apiKeyKeys.detail(revokedKey.id), revokedKey);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Revoke API key error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to regenerate an API key
 */
export function useRegenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiKeysApi.regenerate(id),
    onSuccess: (newApiKeyResponse) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        apiKeyKeys.detail(newApiKeyResponse.key.id),
        newApiKeyResponse.key
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Regenerate API key error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
