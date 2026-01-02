import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { externalAgentsApi } from "../api";
import type {
  CreateExternalAgentRequest,
  UpdateExternalAgentRequest,
  InvokeExternalAgentRequest,
  ExternalAgentFilters,
} from "../types";
import { AxiosError } from "axios";
import queryKeys from "@/lib/queryKeys";

/**
 * Hook to get all external agents with optional filters
 */
export function useExternalAgents(filters?: ExternalAgentFilters) {
  return useQuery({
    queryKey: queryKeys.externalAgents.list(filters),
    queryFn: () => externalAgentsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for governance updates
  });
}

/**
 * Hook to get a single external agent by ID
 */
export function useExternalAgent(id: string) {
  return useQuery({
    queryKey: queryKeys.externalAgents.detail(id),
    queryFn: () => externalAgentsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new external agent
 */
export function useCreateExternalAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExternalAgentRequest) =>
      externalAgentsApi.create(input),
    onSuccess: (newAgent) => {
      // Invalidate external agents list
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.lists(),
      });
      // Set the new agent in cache
      queryClient.setQueryData(
        queryKeys.externalAgents.detail(newAgent.id),
        newAgent
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create external agent error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update an external agent
 */
export function useUpdateExternalAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateExternalAgentRequest;
    }) => externalAgentsApi.update(id, input),
    onSuccess: (updatedAgent) => {
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.lists(),
      });
      // Update detail cache
      queryClient.setQueryData(
        queryKeys.externalAgents.detail(updatedAgent.id),
        updatedAgent
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update external agent error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete an external agent
 */
export function useDeleteExternalAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => externalAgentsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.lists(),
      });
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.externalAgents.detail(id),
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete external agent error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to invoke an external agent
 */
export function useInvokeExternalAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: InvokeExternalAgentRequest;
    }) => externalAgentsApi.invoke(id, input),
    onSuccess: (_, { id }) => {
      // Invalidate invocations list
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.invocations(id),
      });
      // Invalidate governance status (invocation affects budgets/rate limits)
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.governance(id),
      });
      // Invalidate agent detail (last_invocation_at updated)
      queryClient.invalidateQueries({
        queryKey: queryKeys.externalAgents.detail(id),
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Invoke external agent error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to get invocations for an external agent
 */
export function useExternalAgentInvocations(agentId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.externalAgents.invocations(agentId, limit),
    queryFn: () => externalAgentsApi.getInvocations(agentId, limit),
    enabled: !!agentId,
    staleTime: 10 * 1000, // 10 seconds (invocation history changes frequently)
  });
}

/**
 * Hook to get governance status for an external agent
 */
export function useExternalAgentGovernance(agentId: string) {
  return useQuery({
    queryKey: queryKeys.externalAgents.governance(agentId),
    queryFn: () => externalAgentsApi.getGovernanceStatus(agentId),
    enabled: !!agentId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
}

/**
 * Hook to get lineage graph for an external agent
 */
export function useExternalAgentLineage(agentId: string) {
  return useQuery({
    queryKey: queryKeys.externalAgents.lineage(agentId),
    queryFn: () => externalAgentsApi.getLineageGraph(agentId),
    enabled: !!agentId,
    staleTime: 60 * 1000, // 1 minute (lineage changes less frequently)
  });
}
