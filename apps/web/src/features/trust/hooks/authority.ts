/**
 * Authority Management Hooks
 *
 * React Query hooks for authority operations (Phase 4)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AuthorityFilters,
  CreateAuthorityInput,
  UpdateAuthorityInput,
} from "../types";
import * as trustApi from "../api";

/**
 * Hook to get authorities with filters (UI-focused)
 */
export function useAuthoritiesFiltered(filters?: AuthorityFilters) {
  return useQuery({
    queryKey: ["authoritiesFiltered", filters],
    queryFn: () => trustApi.getAuthorities(filters),
  });
}

/**
 * Hook to get authority by ID (UI-focused)
 */
export function useAuthorityById(id: string) {
  return useQuery({
    queryKey: ["authorityById", id],
    queryFn: () => trustApi.getAuthorityById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create authority
 */
export function useCreateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAuthorityInput) =>
      trustApi.createAuthority(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
      queryClient.invalidateQueries({ queryKey: ["authoritiesFiltered"] });
    },
  });
}

/**
 * Hook to update authority
 */
export function useUpdateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAuthorityInput }) =>
      trustApi.updateAuthority(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
      queryClient.invalidateQueries({ queryKey: ["authoritiesFiltered"] });
      queryClient.invalidateQueries({
        queryKey: ["authorityById", variables.id],
      });
    },
  });
}

/**
 * Hook to deactivate authority
 */
export function useDeactivateAuthority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      trustApi.deactivateAuthority(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["authorities"] });
      queryClient.invalidateQueries({ queryKey: ["authoritiesFiltered"] });
      queryClient.invalidateQueries({
        queryKey: ["authorityById", variables.id],
      });
    },
  });
}

/**
 * Hook to get authority agents
 */
export function useAuthorityAgents(id: string) {
  return useQuery({
    queryKey: ["authorityAgents", id],
    queryFn: () => trustApi.getAuthorityAgents(id),
    enabled: !!id,
  });
}
