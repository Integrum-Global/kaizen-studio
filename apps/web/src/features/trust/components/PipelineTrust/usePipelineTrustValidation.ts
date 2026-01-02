/**
 * usePipelineTrustValidation Hook
 *
 * Custom hook for pipeline trust validation
 * Features:
 * - Validate all agents in pipeline
 * - Track validation state
 * - Handle batch validation
 * - Cache validation results
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PipelineTrustStatus,
  AgentPipelineStatus,
  TrustValidationInput,
} from "../../types";
import * as trustApi from "../../api";

interface UsePipelineTrustValidationOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

/**
 * Hook to validate trust for all agents in a pipeline
 */
export function usePipelineTrustValidation(
  pipelineId: string,
  agentIds: string[],
  requiredCapabilities: Record<string, string[]> = {},
  options?: UsePipelineTrustValidationOptions
) {
  return useQuery<PipelineTrustStatus>({
    queryKey: ["pipelineTrustValidation", pipelineId, agentIds],
    queryFn: () =>
      trustApi.validatePipelineTrust({
        pipelineId,
        agentIds,
        requiredCapabilities,
      }),
    enabled: options?.enabled !== false && !!pipelineId && agentIds.length > 0,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime || 30000, // Cache for 30 seconds by default
  });
}

/**
 * Hook to get agent trust status for a specific pipeline
 */
export function useAgentPipelineStatus(agentId: string, pipelineId: string) {
  return useQuery<AgentPipelineStatus>({
    queryKey: ["agentPipelineStatus", agentId, pipelineId],
    queryFn: () => trustApi.getAgentTrustForPipeline(agentId, pipelineId),
    enabled: !!agentId && !!pipelineId,
  });
}

/**
 * Hook to batch validate multiple agents
 */
export function useBatchValidatePipelineAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TrustValidationInput) => {
      return trustApi.validatePipelineTrust(input);
    },
    onSuccess: (data, variables) => {
      // Update cache for this pipeline
      queryClient.setQueryData(
        ["pipelineTrustValidation", variables.pipelineId, variables.agentIds],
        data
      );
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["pipelineTrustValidation", variables.pipelineId],
      });
    },
  });
}

/**
 * Hook to get cached validation results
 */
export function useValidationCache(pipelineId: string, agentIds: string[]) {
  const queryClient = useQueryClient();

  const getCachedValidation = () => {
    return queryClient.getQueryData<PipelineTrustStatus>([
      "pipelineTrustValidation",
      pipelineId,
      agentIds,
    ]);
  };

  const invalidateCache = () => {
    queryClient.invalidateQueries({
      queryKey: ["pipelineTrustValidation", pipelineId],
    });
  };

  return {
    getCachedValidation,
    invalidateCache,
  };
}
