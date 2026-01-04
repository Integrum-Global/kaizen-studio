/**
 * Tests for usePolicyReferences hooks
 *
 * These tests verify the policy reference management hooks including:
 * - useValidateConditions: Mutation hook for validating conditions
 * - useValidateConditionsFromPolicies: Simplified interface for policy conditions
 * - usePolicyReferences: Query hook for fetching policy references
 * - usePolicyReferenceIssues: Derived hook for filtering reference issues
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useValidateConditions,
  useValidateConditionsFromPolicies,
  usePolicyReferences,
  usePolicyReferenceIssues,
  policyReferenceKeys,
} from "../usePolicyReferences";
import { governanceApi } from "../../api";
import type {
  ConditionValidationResult,
  PolicyReferencesResponse,
  PolicyCondition,
  ResourceReferenceStatus,
} from "../../types";

// Mock the governance API
vi.mock("../../api", () => ({
  governanceApi: {
    validateConditions: vi.fn(),
    getPolicyReferences: vi.fn(),
  },
}));

// Helper to create test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

describe("usePolicyReferences Hooks", () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============ policyReferenceKeys tests ============

  describe("policyReferenceKeys", () => {
    it("creates correct all key", () => {
      expect(policyReferenceKeys.all).toEqual([
        "governance",
        "policies",
        "references",
      ]);
    });

    it("creates correct detail key with policy ID", () => {
      const policyId = "policy-123";
      expect(policyReferenceKeys.detail(policyId)).toEqual([
        "governance",
        "policies",
        "references",
        "policy-123",
      ]);
    });

    it("creates correct validation key", () => {
      expect(policyReferenceKeys.validation()).toEqual([
        "governance",
        "policies",
        "validation",
      ]);
    });

    it("creates unique detail keys for different policy IDs", () => {
      const key1 = policyReferenceKeys.detail("policy-1");
      const key2 = policyReferenceKeys.detail("policy-2");
      expect(key1).not.toEqual(key2);
      expect(key1[key1.length - 1]).toBe("policy-1");
      expect(key2[key2.length - 1]).toBe("policy-2");
    });
  });

  // ============ useValidateConditions tests ============

  describe("useValidateConditions", () => {
    const mockValidationResult: ConditionValidationResult = {
      is_valid: true,
      errors: [],
      warnings: [],
      references: [
        {
          type: "agent",
          id: "agent-123",
          name: "Test Agent",
          status: "valid",
          validated_at: "2024-01-15T10:00:00Z",
        },
      ],
    };

    it("calls validateConditions API on mutation", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [
            { attribute: "user_email", operator: "equals", value: "test@example.com" },
          ],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(governanceApi.validateConditions).toHaveBeenCalledWith({
        conditions: [
          { attribute: "user_email", operator: "equals", value: "test@example.com" },
        ],
      });
      expect(result.current.data).toEqual(mockValidationResult);
    });

    it("handles validation success with multiple conditions", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [
            { attribute: "user_email", operator: "equals", value: "admin@company.com" },
            { attribute: "resource_environment", operator: "in", value: ["production", "staging"] },
          ],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(governanceApi.validateConditions).toHaveBeenCalledWith({
        conditions: [
          { attribute: "user_email", operator: "equals", value: "admin@company.com" },
          { attribute: "resource_environment", operator: "in", value: ["production", "staging"] },
        ],
      });
    });

    it("handles validation errors from API", async () => {
      const errorResult: ConditionValidationResult = {
        is_valid: false,
        errors: ["Invalid attribute: unknown_attr", "Resource not found"],
        warnings: [],
        references: [],
      };

      vi.mocked(governanceApi.validateConditions).mockResolvedValue(errorResult);

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [
            { attribute: "unknown_attr", operator: "equals", value: "test" },
          ],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.is_valid).toBe(false);
      expect(result.current.data?.errors).toContain("Invalid attribute: unknown_attr");
    });

    it("handles API rejection error", async () => {
      const error = new Error("Network error");
      vi.mocked(governanceApi.validateConditions).mockRejectedValue(error);

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [{ attribute: "test", operator: "equals", value: "value" }],
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it("invalidates validation queries on success", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [{ attribute: "test", operator: "equals", value: "value" }],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: policyReferenceKeys.validation(),
      });
    });

    it("returns pending state while mutation is in progress", async () => {
      let resolvePromise: (value: ConditionValidationResult) => void;
      const pendingPromise = new Promise<ConditionValidationResult>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(governanceApi.validateConditions).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      act(() => {
        result.current.mutate({
          conditions: [{ attribute: "test", operator: "equals", value: "value" }],
        });
      });

      // Wait for the mutation to start
      await waitFor(() => expect(result.current.isPending).toBe(true));

      await act(async () => {
        resolvePromise!(mockValidationResult);
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("handles empty conditions array", async () => {
      const emptyResult: ConditionValidationResult = {
        is_valid: true,
        errors: [],
        warnings: ["No conditions to validate"],
        references: [],
      };

      vi.mocked(governanceApi.validateConditions).mockResolvedValue(emptyResult);

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({ conditions: [] });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.warnings).toContain("No conditions to validate");
    });

    it("returns correct data structure with warnings", async () => {
      const resultWithWarnings: ConditionValidationResult = {
        is_valid: true,
        errors: [],
        warnings: ["Resource 'agent-old' has been modified since last validation"],
        references: [
          {
            type: "agent",
            id: "agent-old",
            name: "Old Agent",
            status: "changed",
            validated_at: "2024-01-15T10:00:00Z",
          },
        ],
      };

      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        resultWithWarnings
      );

      const { result } = renderHook(() => useValidateConditions(), { wrapper });

      await act(async () => {
        result.current.mutate({
          conditions: [{ attribute: "agent_id", operator: "equals", value: "$ref:agent:agent-old" }],
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.warnings.length).toBe(1);
      expect(result.current.data?.references[0].status).toBe("changed");
    });
  });

  // ============ useValidateConditionsFromPolicies tests ============

  describe("useValidateConditionsFromPolicies", () => {
    const mockValidationResult: ConditionValidationResult = {
      is_valid: true,
      errors: [],
      warnings: [],
      references: [],
    };

    it("converts PolicyCondition[] to API format correctly", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      const policyConditions: PolicyCondition[] = [
        {
          id: "cond-1",
          attribute: "user_email",
          operator: "equals",
          value: "test@example.com",
        },
        {
          id: "cond-2",
          attribute: "resource_type",
          operator: "in",
          value: ["agent", "pipeline"],
        },
      ];

      await act(async () => {
        await result.current.validate(policyConditions);
      });

      expect(governanceApi.validateConditions).toHaveBeenCalledWith({
        conditions: [
          { attribute: "user_email", operator: "equals", value: "test@example.com" },
          { attribute: "resource_type", operator: "in", value: ["agent", "pipeline"] },
        ],
      });
    });

    it("strips id field from conditions", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      const policyConditions: PolicyCondition[] = [
        {
          id: "should-be-stripped",
          attribute: "test",
          operator: "equals",
          value: "value",
        },
      ];

      await act(async () => {
        await result.current.validate(policyConditions);
      });

      const calledWith = vi.mocked(governanceApi.validateConditions).mock.calls[0][0];
      expect(calledWith.conditions[0]).not.toHaveProperty("id");
    });

    it("returns validation result from validate function", async () => {
      const expectedResult: ConditionValidationResult = {
        is_valid: false,
        errors: ["Test error"],
        warnings: [],
        references: [],
      };

      vi.mocked(governanceApi.validateConditions).mockResolvedValue(expectedResult);

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      let validationResult: ConditionValidationResult | undefined;

      await act(async () => {
        validationResult = await result.current.validate([
          { id: "1", attribute: "test", operator: "equals", value: "value" },
        ]);
      });

      expect(validationResult).toEqual(expectedResult);
    });

    it("exposes mutate and mutateAsync methods", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      expect(typeof result.current.mutate).toBe("function");
      expect(typeof result.current.mutateAsync).toBe("function");
    });

    it("exposes isPending state", async () => {
      let resolvePromise: (value: ConditionValidationResult) => void;
      const pendingPromise = new Promise<ConditionValidationResult>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(governanceApi.validateConditions).mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.validate([
          { id: "1", attribute: "test", operator: "equals", value: "value" },
        ]);
      });

      // Wait for the mutation to start
      await waitFor(() => expect(result.current.isPending).toBe(true));

      await act(async () => {
        resolvePromise!(mockValidationResult);
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
    });

    it("exposes data from last validation", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      await act(async () => {
        await result.current.validate([
          { id: "1", attribute: "test", operator: "equals", value: "value" },
        ]);
      });

      // Wait for the mutation to settle
      await waitFor(() => expect(result.current.data).toEqual(mockValidationResult));
    });

    it("exposes error state on failure", async () => {
      const error = new Error("Validation failed");
      vi.mocked(governanceApi.validateConditions).mockRejectedValue(error);

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.validate([
            { id: "1", attribute: "test", operator: "equals", value: "value" },
          ]);
        } catch {
          // Expected to throw
        }
      });

      // Wait for the error state to be set
      await waitFor(() => expect(result.current.error).toEqual(error));
    });

    it("exposes reset function to clear mutation state", async () => {
      vi.mocked(governanceApi.validateConditions).mockResolvedValue(
        mockValidationResult
      );

      const { result } = renderHook(() => useValidateConditionsFromPolicies(), {
        wrapper,
      });

      await act(async () => {
        await result.current.validate([
          { id: "1", attribute: "test", operator: "equals", value: "value" },
        ]);
      });

      // Wait for the data to be set
      await waitFor(() => expect(result.current.data).toBeDefined());

      // Verify reset function exists
      expect(typeof result.current.reset).toBe("function");

      // Call reset - this clears mutation state
      act(() => {
        result.current.reset();
      });

      // After reset, wait for state to clear
      await waitFor(() => expect(result.current.data).toBeUndefined());
    });
  });

  // ============ usePolicyReferences tests ============

  describe("usePolicyReferences", () => {
    const mockReferencesResponse: PolicyReferencesResponse = {
      policy_id: "policy-123",
      references: [
        {
          type: "agent",
          id: "agent-1",
          name: "Agent One",
          status: "valid",
          validated_at: "2024-01-15T10:00:00Z",
        },
        {
          type: "pipeline",
          id: "pipeline-1",
          name: "Pipeline One",
          status: "orphaned",
          validated_at: "2024-01-15T10:00:00Z",
        },
      ],
      validated_at: "2024-01-15T10:00:00Z",
    };

    it("fetches references for a policy ID", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        mockReferencesResponse
      );

      const { result } = renderHook(() => usePolicyReferences("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(governanceApi.getPolicyReferences).toHaveBeenCalledWith("policy-123");
      expect(result.current.data).toEqual(mockReferencesResponse);
    });

    it("does not fetch when policy ID is empty", () => {
      const { result } = renderHook(() => usePolicyReferences(""), { wrapper });

      expect(governanceApi.getPolicyReferences).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it("handles API errors gracefully", async () => {
      const error = new Error("Policy not found");
      vi.mocked(governanceApi.getPolicyReferences).mockRejectedValue(error);

      const { result } = renderHook(() => usePolicyReferences("invalid-policy"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it("returns loading state initially", () => {
      vi.mocked(governanceApi.getPolicyReferences).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePolicyReferences("policy-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("uses correct query key", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        mockReferencesResponse
      );

      renderHook(() => usePolicyReferences("policy-456"), { wrapper });

      await waitFor(() =>
        expect(governanceApi.getPolicyReferences).toHaveBeenCalled()
      );

      const queryState = queryClient.getQueryState(
        policyReferenceKeys.detail("policy-456")
      );
      expect(queryState).toBeDefined();
    });

    it("caches response with 30 second stale time", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        mockReferencesResponse
      );

      const { result, rerender } = renderHook(
        () => usePolicyReferences("policy-123"),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Rerender should not trigger new API call
      rerender();

      expect(governanceApi.getPolicyReferences).toHaveBeenCalledTimes(1);
    });
  });

  // ============ usePolicyReferenceIssues tests ============

  describe("usePolicyReferenceIssues", () => {
    const createMockReferences = (
      statuses: ResourceReferenceStatus["status"][]
    ): PolicyReferencesResponse => ({
      policy_id: "policy-123",
      references: statuses.map((status, index) => ({
        type: "agent",
        id: `agent-${index}`,
        name: `Agent ${index}`,
        status,
        validated_at: "2024-01-15T10:00:00Z",
      })),
      validated_at: "2024-01-15T10:00:00Z",
    });

    it("returns hasIssues=false when all references are valid", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid", "valid", "valid"])
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasIssues).toBe(false);
      expect(result.current.orphanedReferences).toHaveLength(0);
      expect(result.current.changedReferences).toHaveLength(0);
    });

    it("returns hasIssues=true when there are orphaned references", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid", "orphaned", "valid"])
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasIssues).toBe(true);
      expect(result.current.orphanedReferences).toHaveLength(1);
    });

    it("returns hasIssues=true when there are changed references", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid", "changed", "valid"])
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasIssues).toBe(true);
      expect(result.current.changedReferences).toHaveLength(1);
    });

    it("filters and categorizes references correctly", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid", "orphaned", "changed", "valid", "orphaned"])
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.validReferences).toHaveLength(2);
      expect(result.current.orphanedReferences).toHaveLength(2);
      expect(result.current.changedReferences).toHaveLength(1);
      expect(result.current.references).toHaveLength(5);
    });

    it("returns empty arrays when no data", () => {
      vi.mocked(governanceApi.getPolicyReferences).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      expect(result.current.hasIssues).toBe(false);
      expect(result.current.references).toEqual([]);
      expect(result.current.orphanedReferences).toEqual([]);
      expect(result.current.changedReferences).toEqual([]);
      expect(result.current.validReferences).toEqual([]);
    });

    it("exposes refetch function", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid"])
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(typeof result.current.refetch).toBe("function");

      // Update mock and refetch
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(
        createMockReferences(["valid", "orphaned"])
      );

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.orphanedReferences).toHaveLength(1);
      });
    });

    it("handles empty references array", async () => {
      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue({
        policy_id: "policy-123",
        references: [],
        validated_at: "2024-01-15T10:00:00Z",
      });

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasIssues).toBe(false);
      expect(result.current.references).toEqual([]);
    });

    it("exposes error state from underlying query", async () => {
      const error = new Error("Failed to fetch");
      vi.mocked(governanceApi.getPolicyReferences).mockRejectedValue(error);

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      // Wait for the query to fail and set error state
      // Note: QueryClient is configured with retry: false in test setup
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 }
      );

      // After loading completes, check for error
      expect(result.current.error).toBeDefined();
      expect((result.current.error as Error)?.message).toBe("Failed to fetch");
    });

    it("exposes isLoading state", () => {
      vi.mocked(governanceApi.getPolicyReferences).mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("correctly identifies mixed status scenario", async () => {
      const mixedResponse: PolicyReferencesResponse = {
        policy_id: "policy-123",
        references: [
          { type: "agent", id: "a1", name: "Valid Agent", status: "valid", validated_at: "2024-01-15T10:00:00Z" },
          { type: "pipeline", id: "p1", name: "Deleted Pipeline", status: "orphaned", validated_at: "2024-01-15T10:00:00Z" },
          { type: "team", id: "t1", name: "Modified Team", status: "changed", validated_at: "2024-01-15T10:00:00Z" },
          { type: "deployment", id: "d1", name: "Active Deployment", status: "valid", validated_at: "2024-01-15T10:00:00Z" },
        ],
        validated_at: "2024-01-15T10:00:00Z",
      };

      vi.mocked(governanceApi.getPolicyReferences).mockResolvedValue(mixedResponse);

      const { result } = renderHook(() => usePolicyReferenceIssues("policy-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.hasIssues).toBe(true);
      expect(result.current.validReferences).toHaveLength(2);
      expect(result.current.orphanedReferences).toHaveLength(1);
      expect(result.current.changedReferences).toHaveLength(1);
      expect(result.current.orphanedReferences[0].name).toBe("Deleted Pipeline");
      expect(result.current.changedReferences[0].name).toBe("Modified Team");
    });
  });
});
