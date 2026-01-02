import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deploymentsApi } from "../api";
import type {
  CreateDeploymentInput,
  UpdateDeploymentInput,
  DeploymentFilters,
} from "../types";
import { AxiosError } from "axios";

/**
 * Query key factory for deployments
 */
export const deploymentKeys = {
  all: ["deployments"] as const,
  lists: () => [...deploymentKeys.all, "list"] as const,
  list: (filters?: DeploymentFilters) =>
    [...deploymentKeys.lists(), filters] as const,
  details: () => [...deploymentKeys.all, "detail"] as const,
  detail: (id: string) => [...deploymentKeys.details(), id] as const,
};

/**
 * Hook to get all deployments with optional filters
 */
export function useDeployments(filters?: DeploymentFilters) {
  return useQuery({
    queryKey: deploymentKeys.list(filters),
    queryFn: () => deploymentsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single deployment by ID
 */
export function useDeployment(id: string) {
  return useQuery({
    queryKey: deploymentKeys.detail(id),
    queryFn: () => deploymentsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new deployment
 */
export function useCreateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDeploymentInput) => deploymentsApi.create(input),
    onSuccess: (newDeployment) => {
      // Invalidate deployments list
      queryClient.invalidateQueries({ queryKey: deploymentKeys.lists() });
      // Set the new deployment in cache
      queryClient.setQueryData(
        deploymentKeys.detail(newDeployment.id),
        newDeployment
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create deployment error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update a deployment
 */
export function useUpdateDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeploymentInput }) =>
      deploymentsApi.update(id, input),
    onSuccess: (updatedDeployment) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: deploymentKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        deploymentKeys.detail(updatedDeployment.id),
        updatedDeployment
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update deployment error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete a deployment
 */
export function useDeleteDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deploymentsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: deploymentKeys.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: deploymentKeys.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete deployment error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to start a deployment
 */
export function useStartDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deploymentsApi.start(id),
    onSuccess: (updatedDeployment) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: deploymentKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        deploymentKeys.detail(updatedDeployment.id),
        updatedDeployment
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Start deployment error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to stop a deployment
 */
export function useStopDeployment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deploymentsApi.stop(id),
    onSuccess: (updatedDeployment) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: deploymentKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        deploymentKeys.detail(updatedDeployment.id),
        updatedDeployment
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Stop deployment error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
