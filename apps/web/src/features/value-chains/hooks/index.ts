/**
 * Value Chains Hooks
 *
 * React Query hooks for value chain data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchValueChains,
  fetchValueChain,
  fetchEnterpriseMetrics,
  createValueChain,
  updateValueChain,
  deleteValueChain,
} from '../api';
import type { ValueChainsFilter, ValueChain } from '../types';

/**
 * Query keys for value chains
 */
export const valueChainKeys = {
  all: ['value-chains'] as const,
  lists: () => [...valueChainKeys.all, 'list'] as const,
  list: (filter?: ValueChainsFilter) => [...valueChainKeys.lists(), filter] as const,
  details: () => [...valueChainKeys.all, 'detail'] as const,
  detail: (id: string) => [...valueChainKeys.details(), id] as const,
  metrics: () => [...valueChainKeys.all, 'metrics'] as const,
};

/**
 * Hook to fetch value chains list
 */
export function useValueChains(filter?: ValueChainsFilter) {
  return useQuery({
    queryKey: valueChainKeys.list(filter),
    queryFn: () => fetchValueChains(filter),
  });
}

/**
 * Hook to fetch single value chain
 */
export function useValueChain(id: string) {
  return useQuery({
    queryKey: valueChainKeys.detail(id),
    queryFn: () => fetchValueChain(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch enterprise metrics
 */
export function useEnterpriseMetrics() {
  return useQuery({
    queryKey: valueChainKeys.metrics(),
    queryFn: fetchEnterpriseMetrics,
    refetchInterval: 60000, // Refresh every minute
  });
}

/**
 * Hook to create a value chain
 */
export function useCreateValueChain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createValueChain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valueChainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valueChainKeys.metrics() });
    },
  });
}

/**
 * Hook to update a value chain
 */
export function useUpdateValueChain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ValueChain> }) =>
      updateValueChain(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: valueChainKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: valueChainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valueChainKeys.metrics() });
    },
  });
}

/**
 * Hook to delete a value chain
 */
export function useDeleteValueChain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteValueChain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valueChainKeys.lists() });
      queryClient.invalidateQueries({ queryKey: valueChainKeys.metrics() });
    },
  });
}
