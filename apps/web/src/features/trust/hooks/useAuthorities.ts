/**
 * React Query hooks for Authority Management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuthorities,
  getAuthorityById,
  createAuthority,
  updateAuthority,
  deactivateAuthority,
  getAuthorityAgents,
} from "../api";
import type {
  AuthorityFilters,
  CreateAuthorityInput,
  UpdateAuthorityInput,
} from "../types/authority";

// Query keys
const authorityKeys = {
  all: ["authorities"] as const,
  lists: () => [...authorityKeys.all, "list"] as const,
  list: (filters?: AuthorityFilters) =>
    [...authorityKeys.lists(), filters] as const,
  details: () => [...authorityKeys.all, "detail"] as const,
  detail: (id: string) => [...authorityKeys.details(), id] as const,
  agents: (id: string) => [...authorityKeys.all, "agents", id] as const,
};

/**
 * Hook to fetch list of authorities with optional filters
 */
export function useAuthorities(filters?: AuthorityFilters) {
  return useQuery({
    queryKey: authorityKeys.list(filters),
    queryFn: () => getAuthorities(filters),
  });
}

/**
 * Hook to fetch single authority by ID
 */
export function useAuthority(id: string) {
  return useQuery({
    queryKey: authorityKeys.detail(id),
    queryFn: () => getAuthorityById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to fetch agents established by an authority
 */
export function useAuthorityAgents(authorityId: string) {
  return useQuery({
    queryKey: authorityKeys.agents(authorityId),
    queryFn: () => getAuthorityAgents(authorityId),
    enabled: Boolean(authorityId),
  });
}

/**
 * Hook to create a new authority
 */
export function useCreateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAuthorityInput) => createAuthority(input),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() });
    },
  });
}

/**
 * Hook to update an authority
 */
export function useUpdateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAuthorityInput;
    }) => updateAuthority(id, input),
    onSuccess: (data) => {
      // Invalidate lists and update detail
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() });
      queryClient.setQueryData(authorityKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to deactivate an authority
 */
export function useDeactivateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      deactivateAuthority(id, reason),
    onSuccess: (data) => {
      // Invalidate lists and update detail
      queryClient.invalidateQueries({ queryKey: authorityKeys.lists() });
      queryClient.setQueryData(authorityKeys.detail(data.id), data);
    },
  });
}

export { authorityKeys };
