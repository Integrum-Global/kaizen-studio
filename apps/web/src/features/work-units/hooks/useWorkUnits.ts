/**
 * Work Units Hooks
 *
 * React Query hooks for work unit data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WorkUnitFilters,
  CreateWorkUnitInput,
  UpdateWorkUnitInput,
} from '../types';
import {
  fetchWorkUnits,
  fetchWorkUnit,
  createWorkUnit,
  updateWorkUnit,
  deleteWorkUnit,
  runWorkUnit,
  fetchRecentRuns,
  fetchAvailableTasks,
  fetchUserRecentRuns,
  fetchWorkspaces,
  fetchDelegatees,
  fetchProcesses,
  fetchTeamActivity,
} from '../api';
import { useToast } from '@/hooks/use-toast';

/**
 * Query key factory for work units
 */
export const workUnitKeys = {
  all: ['work-units'] as const,
  lists: () => [...workUnitKeys.all, 'list'] as const,
  list: (filters?: WorkUnitFilters) => [...workUnitKeys.lists(), filters] as const,
  details: () => [...workUnitKeys.all, 'detail'] as const,
  detail: (id: string) => [...workUnitKeys.details(), id] as const,
  runs: (id: string) => [...workUnitKeys.all, 'runs', id] as const,
  available: () => [...workUnitKeys.all, 'available'] as const,
  recentRuns: () => [...workUnitKeys.all, 'recent-runs'] as const,
  workspaces: () => ['workspaces'] as const,
  delegatees: () => ['delegatees'] as const,
};

/**
 * Hook to fetch paginated work units with filters
 */
export function useWorkUnits(
  filters?: WorkUnitFilters,
  page = 1,
  pageSize = 20
) {
  return useQuery({
    queryKey: workUnitKeys.list(filters),
    queryFn: () => fetchWorkUnits(filters, page, pageSize),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch a single work unit
 */
export function useWorkUnit(id: string | undefined) {
  return useQuery({
    queryKey: workUnitKeys.detail(id || ''),
    queryFn: () => fetchWorkUnit(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch available tasks for Level 1 view
 */
export function useAvailableTasks() {
  return useQuery({
    queryKey: workUnitKeys.available(),
    queryFn: fetchAvailableTasks,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch user's recent runs
 */
export function useUserRecentRuns(limit = 10) {
  return useQuery({
    queryKey: workUnitKeys.recentRuns(),
    queryFn: () => fetchUserRecentRuns(limit),
    staleTime: 10 * 1000, // 10 seconds - runs change more frequently
  });
}

/**
 * Hook to fetch recent runs for a specific work unit
 */
export function useWorkUnitRuns(workUnitId: string | undefined, limit = 5) {
  return useQuery({
    queryKey: workUnitKeys.runs(workUnitId || ''),
    queryFn: () => fetchRecentRuns(workUnitId!, limit),
    enabled: !!workUnitId,
    staleTime: 10 * 1000,
  });
}

/**
 * Hook for running a work unit
 */
export function useRunWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      workUnitId,
      inputs,
    }: {
      workUnitId: string;
      inputs?: Record<string, unknown>;
    }) => runWorkUnit(workUnitId, inputs),
    onSuccess: (result, { workUnitId }) => {
      // Invalidate runs queries
      queryClient.invalidateQueries({ queryKey: workUnitKeys.runs(workUnitId) });
      queryClient.invalidateQueries({ queryKey: workUnitKeys.recentRuns() });

      toast({
        title: 'Task started',
        description: `Run ${result.id} has been initiated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to start task',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for creating a work unit
 */
export function useCreateWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateWorkUnitInput) => createWorkUnit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workUnitKeys.lists() });
      toast({
        title: 'Work unit created',
        description: 'The new work unit has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create work unit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating a work unit
 */
export function useUpdateWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkUnitInput }) =>
      updateWorkUnit(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: workUnitKeys.lists() });
      queryClient.setQueryData(workUnitKeys.detail(result.id), result);
      toast({
        title: 'Work unit updated',
        description: 'Changes have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update work unit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for deleting a work unit
 */
export function useDeleteWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWorkUnit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workUnitKeys.lists() });
      queryClient.removeQueries({ queryKey: workUnitKeys.detail(id) });
      toast({
        title: 'Work unit deleted',
        description: 'The work unit has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete work unit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to fetch available workspaces
 */
export function useWorkspaces() {
  return useQuery({
    queryKey: workUnitKeys.workspaces(),
    queryFn: fetchWorkspaces,
    staleTime: 5 * 60 * 1000, // 5 minutes - workspaces don't change often
  });
}

/**
 * Hook to fetch available delegatees
 */
export function useDelegatees() {
  return useQuery({
    queryKey: workUnitKeys.delegatees(),
    queryFn: fetchDelegatees,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch processes (composite work units) for Level 2 view
 */
export function useProcesses() {
  return useQuery({
    queryKey: [...workUnitKeys.all, 'processes'] as const,
    queryFn: fetchProcesses,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch team activity
 */
export function useTeamActivity(limit = 10) {
  return useQuery({
    queryKey: ['team-activity', limit] as const,
    queryFn: () => fetchTeamActivity(limit),
    staleTime: 10 * 1000, // 10 seconds - activity changes frequently
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
}
