import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { governanceApi } from "../api";
import type {
  ValidateConditionsRequest,
  PolicyCondition,
  ConditionValidationResult,
} from "../types";
import { governanceKeys } from "./useGovernance";

/**
 * Query key factory for policy references
 */
export const policyReferenceKeys = {
  all: [...governanceKeys.policies(), "references"] as const,
  detail: (policyId: string) =>
    [...policyReferenceKeys.all, policyId] as const,
  validation: () => [...governanceKeys.policies(), "validation"] as const,
};

/**
 * Hook to validate conditions before saving
 * Uses POST /api/v1/policies/validate-conditions
 */
export function useValidateConditions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ValidateConditionsRequest) =>
      governanceApi.validateConditions(request),
    onSuccess: () => {
      // Optionally invalidate related queries
      queryClient.invalidateQueries({
        queryKey: policyReferenceKeys.validation(),
      });
    },
  });
}

/**
 * Hook to validate conditions with a simpler interface
 * Accepts PolicyCondition[] and converts to API format
 */
export function useValidateConditionsFromPolicies() {
  const validateMutation = useValidateConditions();

  const validate = async (
    conditions: PolicyCondition[]
  ): Promise<ConditionValidationResult> => {
    const request: ValidateConditionsRequest = {
      conditions: conditions.map((c) => ({
        attribute: c.attribute,
        operator: c.operator,
        value: c.value,
      })),
    };

    return validateMutation.mutateAsync(request);
  };

  return {
    validate,
    mutate: validateMutation.mutate,
    mutateAsync: validateMutation.mutateAsync,
    isPending: validateMutation.isPending,
    data: validateMutation.data,
    error: validateMutation.error,
    reset: validateMutation.reset,
  };
}

/**
 * Hook to get policy references
 * Uses GET /api/v1/policies/{id}/references
 */
export function usePolicyReferences(policyId: string) {
  return useQuery({
    queryKey: policyReferenceKeys.detail(policyId),
    queryFn: () => governanceApi.getPolicyReferences(policyId),
    enabled: !!policyId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to check if any references have issues (orphaned or changed)
 */
export function usePolicyReferenceIssues(policyId: string) {
  const { data, isLoading, error, refetch } = usePolicyReferences(policyId);

  const hasIssues =
    data?.references.some(
      (ref) => ref.status === "orphaned" || ref.status === "changed"
    ) ?? false;

  const orphanedReferences =
    data?.references.filter((ref) => ref.status === "orphaned") ?? [];
  const changedReferences =
    data?.references.filter((ref) => ref.status === "changed") ?? [];
  const validReferences =
    data?.references.filter((ref) => ref.status === "valid") ?? [];

  return {
    references: data?.references ?? [],
    hasIssues,
    orphanedReferences,
    changedReferences,
    validReferences,
    isLoading,
    error,
    refetch,
  };
}
