import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectorsApi } from "../api";
import type {
  CreateConnectorRequest,
  UpdateConnectorRequest,
  ConnectorFilters,
} from "../types";
import { AxiosError } from "axios";
import queryKeys from "@/lib/queryKeys";

/**
 * Hook to get all connectors with optional filters
 */
export function useConnectors(filters?: ConnectorFilters) {
  return useQuery({
    queryKey: queryKeys.connectors.list(filters),
    queryFn: () => connectorsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single connector by ID
 */
export function useConnector(id: string) {
  return useQuery({
    queryKey: queryKeys.connectors.detail(id),
    queryFn: () => connectorsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new connector
 */
export function useCreateConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConnectorRequest) => connectorsApi.create(input),
    onSuccess: (newConnector) => {
      // Invalidate connectors list
      queryClient.invalidateQueries({ queryKey: queryKeys.connectors.lists() });
      // Set the new connector in cache
      queryClient.setQueryData(
        queryKeys.connectors.detail(newConnector.id),
        newConnector
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create connector error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a connector
 */
export function useUpdateConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateConnectorRequest;
    }) => connectorsApi.update(id, input),
    onSuccess: (updatedConnector) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.connectors.lists() });
      // Update detail cache
      queryClient.setQueryData(
        queryKeys.connectors.detail(updatedConnector.id),
        updatedConnector
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update connector error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete a connector
 */
export function useDeleteConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectorsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.connectors.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.connectors.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete connector error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to test a connector connection
 */
export function useTestConnector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => connectorsApi.testConnection(id),
    onSuccess: (_, id) => {
      // Invalidate the connector detail to refetch updated test results
      queryClient.invalidateQueries({
        queryKey: queryKeys.connectors.detail(id),
      });
      // Also invalidate lists in case test status is displayed
      queryClient.invalidateQueries({ queryKey: queryKeys.connectors.lists() });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Test connector error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
