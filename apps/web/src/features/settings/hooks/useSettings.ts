import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api";
import type {
  UpdateOrganizationSettingsInput,
  UpdateUserSettingsInput,
} from "../types";

export const settingsKeys = {
  all: ["settings"] as const,
  organization: () => [...settingsKeys.all, "organization"] as const,
  user: () => [...settingsKeys.all, "user"] as const,
};

/**
 * Hook to fetch organization settings
 */
export function useOrganizationSettings() {
  return useQuery({
    queryKey: settingsKeys.organization(),
    queryFn: () => settingsApi.getOrganizationSettings(),
  });
}

/**
 * Hook to update organization settings
 */
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationSettingsInput) =>
      settingsApi.updateOrganizationSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.organization() });
    },
  });
}

/**
 * Hook to fetch user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: () => settingsApi.getUserSettings(),
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserSettingsInput) =>
      settingsApi.updateUserSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}
