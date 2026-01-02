import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentsApi } from "../api";
import type {
  CreateAgentInput,
  UpdateAgentInput,
  AgentFilters,
} from "../types";

const QUERY_KEYS = {
  all: ["agents"] as const,
  lists: () => [...QUERY_KEYS.all, "list"] as const,
  list: (filters?: AgentFilters) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

/**
 * Hook to fetch all agents with optional filters
 */
export function useAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => agentsApi.getAll(filters),
  });
}

/**
 * Hook to fetch a single agent by ID
 */
export function useAgent(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => agentsApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new agent
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAgentInput) => agentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to update an existing agent
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentInput }) =>
      agentsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to delete an agent
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook to duplicate an agent
 */
export function useDuplicateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agentsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
}
