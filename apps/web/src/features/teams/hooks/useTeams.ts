import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi } from "../api";
import type {
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  UpdateTeamMemberRoleInput,
  TeamFilters,
} from "../types";
import { AxiosError } from "axios";

/**
 * Query key factory for teams
 */
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (filters?: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

/**
 * Hook to get all teams with optional filters
 */
export function useTeams(filters?: TeamFilters) {
  return useQuery({
    queryKey: teamKeys.list(filters),
    queryFn: () => teamsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single team by ID
 */
export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamsApi.create(input),
    onSuccess: (newTeam) => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      // Set the new team in cache
      queryClient.setQueryData(teamKeys.detail(newTeam.id), newTeam);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create team error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTeamInput }) =>
      teamsApi.update(id, input),
    onSuccess: (updatedTeam) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(teamKeys.detail(updatedTeam.id), updatedTeam);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update team error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete a team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teamsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: teamKeys.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete team error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to add a member to a team
 */
export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      input,
    }: {
      teamId: string;
      input: AddTeamMemberInput;
    }) => teamsApi.addMember(teamId, input),
    onSuccess: (_, { teamId }) => {
      // Invalidate the team detail to refetch members
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      // Also invalidate lists in case member count is displayed
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Add team member error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to remove a member from a team
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamsApi.removeMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      // Invalidate the team detail to refetch members
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      // Also invalidate lists in case member count is displayed
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Remove team member error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a team member's role
 */
export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
      input,
    }: {
      teamId: string;
      userId: string;
      input: UpdateTeamMemberRoleInput;
    }) => teamsApi.updateMemberRole(teamId, userId, input),
    onSuccess: (_, { teamId }) => {
      // Invalidate the team detail to refetch members
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update team member role error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
