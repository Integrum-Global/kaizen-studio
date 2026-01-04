/**
 * Workspace Hooks
 *
 * React Query hooks for workspace data fetching and mutations.
 * Workspaces are purpose-driven collections of work units.
 *
 * @see docs/plans/eatp-ontology/04-workspaces.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WorkspaceFilters,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMemberRole,
} from '../types';
import {
  fetchWorkspaces as fetchWorkspacesApi,
  fetchWorkspace,
  createWorkspace,
  updateWorkspace,
  archiveWorkspace,
  restoreWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
  addWorkUnitToWorkspace,
  removeWorkUnitFromWorkspace,
} from '../api/workspaces';
import { useToast } from '@/hooks/use-toast';

/**
 * Query key factory for workspaces
 */
export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: WorkspaceFilters) => [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (id: string) => [...workspaceKeys.all, 'members', id] as const,
  workUnits: (id: string) => [...workspaceKeys.all, 'work-units', id] as const,
};

/**
 * Hook to fetch workspaces with filters
 */
export function useWorkspaceList(filters?: WorkspaceFilters) {
  return useQuery({
    queryKey: workspaceKeys.list(filters),
    queryFn: () => fetchWorkspacesApi(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - workspaces don't change often
  });
}

/**
 * Hook to fetch a single workspace by ID
 */
export function useWorkspaceDetail(id: string | undefined) {
  return useQuery({
    queryKey: workspaceKeys.detail(id || ''),
    queryFn: () => fetchWorkspace(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for creating a new workspace
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => createWorkspace(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      toast({
        title: 'Workspace created',
        description: `"${result.name}" has been created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating a workspace
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkspaceInput }) =>
      updateWorkspace(id, input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.setQueryData(workspaceKeys.detail(result.id), result);
      toast({
        title: 'Workspace updated',
        description: 'Changes have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for archiving a workspace
 */
export function useArchiveWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => archiveWorkspace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(id) });
      toast({
        title: 'Workspace archived',
        description: 'The workspace has been archived.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to archive workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for restoring an archived workspace
 */
export function useRestoreWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => restoreWorkspace(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.setQueryData(workspaceKeys.detail(result.id), result);
      toast({
        title: 'Workspace restored',
        description: `"${result.name}" has been restored.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to restore workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for permanently deleting a workspace
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWorkspace(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
      toast({
        title: 'Workspace deleted',
        description: 'The workspace has been permanently deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete workspace',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for adding a member to a workspace
 */
export function useAddWorkspaceMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: WorkspaceMemberRole;
    }) => addWorkspaceMember(workspaceId, userId, role),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      toast({
        title: 'Member added',
        description: 'The member has been added to the workspace.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add member',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for updating a member's role
 */
export function useUpdateWorkspaceMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: WorkspaceMemberRole;
    }) => updateWorkspaceMember(workspaceId, userId, role),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      toast({
        title: 'Member role updated',
        description: 'The member role has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update member',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for removing a member from a workspace
 */
export function useRemoveWorkspaceMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      removeWorkspaceMember(workspaceId, userId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the workspace.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove member',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for adding a work unit to a workspace
 */
export function useAddWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      workspaceId,
      workUnitId,
      constraints,
    }: {
      workspaceId: string;
      workUnitId: string;
      constraints?: Record<string, unknown>;
    }) => addWorkUnitToWorkspace(workspaceId, workUnitId, constraints),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.workUnits(workspaceId) });
      toast({
        title: 'Work unit added',
        description: 'The work unit has been added to the workspace.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add work unit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook for removing a work unit from a workspace
 */
export function useRemoveWorkUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ workspaceId, workUnitId }: { workspaceId: string; workUnitId: string }) =>
      removeWorkUnitFromWorkspace(workspaceId, workUnitId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.workUnits(workspaceId) });
      toast({
        title: 'Work unit removed',
        description: 'The work unit has been removed from the workspace.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove work unit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });
}
