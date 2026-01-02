import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../api";
import type {
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  AcknowledgeAlertInput,
  AlertFilters,
  AlertRuleFilters,
} from "../types";
import { AxiosError } from "axios";

/**
 * Query key factory for alerts
 */
export const alertKeys = {
  all: ["alerts"] as const,
  lists: () => [...alertKeys.all, "list"] as const,
  list: (filters?: AlertFilters) => [...alertKeys.lists(), filters] as const,
  details: () => [...alertKeys.all, "detail"] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
  history: (id: string) => [...alertKeys.all, "history", id] as const,
};

/**
 * Query key factory for alert rules
 */
export const alertRuleKeys = {
  all: ["alertRules"] as const,
  lists: () => [...alertRuleKeys.all, "list"] as const,
  list: (filters?: AlertRuleFilters) =>
    [...alertRuleKeys.lists(), filters] as const,
  details: () => [...alertRuleKeys.all, "detail"] as const,
  detail: (id: string) => [...alertRuleKeys.details(), id] as const,
};

/**
 * Hook to get all alerts with optional filters
 */
export function useAlerts(filters?: AlertFilters) {
  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: () => alertsApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single alert by ID
 */
export function useAlert(id: string) {
  return useQuery({
    queryKey: alertKeys.detail(id),
    queryFn: () => alertsApi.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AcknowledgeAlertInput }) =>
      alertsApi.acknowledge(id, input),
    onSuccess: (updatedAlert) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(alertKeys.detail(updatedAlert.id), updatedAlert);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Acknowledge alert error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to resolve an alert
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: (updatedAlert) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(alertKeys.detail(updatedAlert.id), updatedAlert);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Resolve alert error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to get alert history
 */
export function useAlertHistory(alertId: string) {
  return useQuery({
    queryKey: alertKeys.history(alertId),
    queryFn: () => alertsApi.getHistory(alertId),
    enabled: !!alertId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get all alert rules with optional filters
 */
export function useAlertRules(filters?: AlertRuleFilters) {
  return useQuery({
    queryKey: alertRuleKeys.list(filters),
    queryFn: () => alertsApi.rules.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to get a single alert rule by ID
 */
export function useAlertRule(id: string) {
  return useQuery({
    queryKey: alertRuleKeys.detail(id),
    queryFn: () => alertsApi.rules.getById(id),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to create a new alert rule
 */
export function useCreateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAlertRuleInput) => alertsApi.rules.create(input),
    onSuccess: (newRule) => {
      // Invalidate alert rules list
      queryClient.invalidateQueries({ queryKey: alertRuleKeys.lists() });
      // Set the new rule in cache
      queryClient.setQueryData(alertRuleKeys.detail(newRule.id), newRule);
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Create alert rule error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to update an alert rule
 */
export function useUpdateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAlertRuleInput }) =>
      alertsApi.rules.update(id, input),
    onSuccess: (updatedRule) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: alertRuleKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        alertRuleKeys.detail(updatedRule.id),
        updatedRule
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Update alert rule error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to delete an alert rule
 */
export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.rules.delete(id),
    onSuccess: (_, id) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: alertRuleKeys.lists() });
      // Remove from cache
      queryClient.removeQueries({ queryKey: alertRuleKeys.detail(id) });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Delete alert rule error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}

/**
 * Hook to toggle alert rule enabled state
 */
export function useToggleAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertsApi.rules.toggle(id),
    onSuccess: (updatedRule) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: alertRuleKeys.lists() });
      // Update detail cache
      queryClient.setQueryData(
        alertRuleKeys.detail(updatedRule.id),
        updatedRule
      );
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      console.error(
        "Toggle alert rule error:",
        error.response?.data?.detail || error.message
      );
    },
  });
}
