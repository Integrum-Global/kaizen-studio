/**
 * ESA (Enterprise Security Authority) Hooks
 *
 * React Query hooks for ESA configuration and management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ESAConfig } from "../types";
import * as trustApi from "../api";

/**
 * Hook to get ESA configuration
 */
export function useESAConfig() {
  return useQuery({
    queryKey: ["esaConfig"],
    queryFn: () => trustApi.getESAConfig(),
  });
}

/**
 * Hook to update ESA configuration
 */
export function useUpdateESAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<ESAConfig>) =>
      trustApi.updateESAConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(["esaConfig"], data);
      queryClient.invalidateQueries({ queryKey: ["esaConfig"] });
    },
  });
}

/**
 * Hook to test ESA connection
 */
export function useTestESAConnection() {
  return useMutation({
    mutationFn: () => trustApi.testESAConnection(),
  });
}
