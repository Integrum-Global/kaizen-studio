/**
 * Trust Hooks Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import {
  useTrustChain,
  useTrustChains,
  useVerifyTrust,
  useTrustDashboardStats,
  useEstablishTrust,
  useDelegateTrust,
} from "../hooks";
import * as trustApi from "../api";
import {
  createMockTrustChain,
  createMockTrustChainsListResponse,
  createMockVerificationResult,
  createMockDelegationRecord,
} from "./fixtures";
import {
  EstablishTrustRequest,
  VerifyTrustRequest,
  DelegateTrustRequest,
  CapabilityType,
  VerificationLevel,
} from "../types";

// Mock the trust API
vi.mock("../api", () => ({
  getTrustChain: vi.fn(),
  listTrustChains: vi.fn(),
  verifyTrust: vi.fn(),
  establishTrust: vi.fn(),
  delegateTrust: vi.fn(),
  queryAuditTrail: vi.fn(),
}));

// Create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
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

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Trust Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useTrustChain", () => {
    it("should fetch trust chain for an agent", async () => {
      const mockChain = createMockTrustChain();
      vi.mocked(trustApi.getTrustChain).mockResolvedValue(mockChain);

      const { result } = renderHook(() => useTrustChain("agent-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.getTrustChain).toHaveBeenCalledWith("agent-123");
      expect(result.current.data).toEqual(mockChain);
    });

    it("should handle loading state", () => {
      vi.mocked(trustApi.getTrustChain).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useTrustChain("agent-123"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should handle error state", async () => {
      const error = new Error("Failed to fetch trust chain");
      vi.mocked(trustApi.getTrustChain).mockRejectedValue(error);

      const { result } = renderHook(() => useTrustChain("agent-123"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });

    it("should not fetch when agentId is empty", () => {
      const { result } = renderHook(() => useTrustChain(""), {
        wrapper: createWrapper(),
      });

      // Query is disabled when agentId is empty
      expect(trustApi.getTrustChain).not.toHaveBeenCalled();
      // Query should not be in loading state when disabled
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useTrustChains", () => {
    it("should fetch list of trust chains", async () => {
      const mockResponse = createMockTrustChainsListResponse();
      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTrustChains(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.listTrustChains).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockResponse);
    });

    it("should fetch with pagination params", async () => {
      const mockResponse = createMockTrustChainsListResponse();
      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockResponse);

      const params = { page: 2, page_size: 20 };
      const { result } = renderHook(() => useTrustChains(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.listTrustChains).toHaveBeenCalledWith(params);
    });

    it("should fetch with status filter", async () => {
      const mockResponse = createMockTrustChainsListResponse();
      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockResponse);

      const params = { status: "valid" };
      const { result } = renderHook(() => useTrustChains(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.listTrustChains).toHaveBeenCalledWith(params);
    });
  });

  describe("useVerifyTrust", () => {
    it("should verify trust mutation", async () => {
      const mockResult = createMockVerificationResult();
      vi.mocked(trustApi.verifyTrust).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useVerifyTrust(), {
        wrapper: createWrapper(),
      });

      const request: VerifyTrustRequest = {
        agent_id: "agent-123",
        action: "read_data",
        resource: "database://db-123",
        level: VerificationLevel.STANDARD,
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.verifyTrust).toHaveBeenCalledWith(request);
      expect(result.current.data).toEqual(mockResult);
    });

    it("should handle verification failure", async () => {
      const error = new Error("Verification failed");
      vi.mocked(trustApi.verifyTrust).mockRejectedValue(error);

      const { result } = renderHook(() => useVerifyTrust(), {
        wrapper: createWrapper(),
      });

      const request: VerifyTrustRequest = {
        agent_id: "agent-123",
        action: "read_data",
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });

    it("should track pending state during verification", async () => {
      vi.mocked(trustApi.verifyTrust).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useVerifyTrust(), {
        wrapper: createWrapper(),
      });

      const request: VerifyTrustRequest = {
        agent_id: "agent-123",
        action: "read_data",
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isPending).toBe(true));
    });
  });

  describe("useTrustDashboardStats", () => {
    it("should fetch dashboard stats", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = {
        items: [],
        total: 0,
      };

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      const { result } = renderHook(() => useTrustDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.total_agents).toBe(3);
    });

    it("should calculate stats from chains", async () => {
      const mockChainsResponse = createMockTrustChainsListResponse();
      const mockAuditResponse = {
        items: [],
        total: 0,
      };

      vi.mocked(trustApi.listTrustChains).mockResolvedValue(mockChainsResponse);
      vi.mocked(trustApi.queryAuditTrail).mockResolvedValue(mockAuditResponse);

      const { result } = renderHook(() => useTrustDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data!;
      expect(stats.total_agents).toBe(3);
      expect(stats.active_agents).toBeGreaterThanOrEqual(0);
      expect(stats.total_delegations).toBeGreaterThanOrEqual(0);
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("Failed to fetch stats");
      vi.mocked(trustApi.listTrustChains).mockRejectedValue(error);

      const { result } = renderHook(() => useTrustDashboardStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useEstablishTrust", () => {
    it("should establish trust for an agent", async () => {
      const mockChain = createMockTrustChain();
      vi.mocked(trustApi.establishTrust).mockResolvedValue(mockChain);

      const { result } = renderHook(() => useEstablishTrust(), {
        wrapper: createWrapper(),
      });

      const request: EstablishTrustRequest = {
        agent_id: "agent-123",
        authority_id: "authority-org-1",
        capabilities: [
          {
            capability: "read_data",
            capability_type: CapabilityType.ACCESS,
          },
        ],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.establishTrust).toHaveBeenCalledWith(request);
      expect(result.current.data).toEqual(mockChain);
    });

    it("should handle establish trust failure", async () => {
      const error = new Error("Failed to establish trust");
      vi.mocked(trustApi.establishTrust).mockRejectedValue(error);

      const { result } = renderHook(() => useEstablishTrust(), {
        wrapper: createWrapper(),
      });

      const request: EstablishTrustRequest = {
        agent_id: "agent-123",
        authority_id: "authority-org-1",
        capabilities: [],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useDelegateTrust", () => {
    it("should delegate trust between agents", async () => {
      const mockDelegation = createMockDelegationRecord();
      vi.mocked(trustApi.delegateTrust).mockResolvedValue(mockDelegation);

      const { result } = renderHook(() => useDelegateTrust(), {
        wrapper: createWrapper(),
      });

      const request: DelegateTrustRequest = {
        delegator_id: "agent-123",
        delegatee_id: "agent-456",
        task_id: "task-789",
        capabilities: ["read_data"],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(trustApi.delegateTrust).toHaveBeenCalledWith(request);
      expect(result.current.data).toEqual(mockDelegation);
    });

    it("should handle delegation failure", async () => {
      const error = new Error("Failed to delegate trust");
      vi.mocked(trustApi.delegateTrust).mockRejectedValue(error);

      const { result } = renderHook(() => useDelegateTrust(), {
        wrapper: createWrapper(),
      });

      const request: DelegateTrustRequest = {
        delegator_id: "agent-123",
        delegatee_id: "agent-456",
        task_id: "task-789",
        capabilities: ["read_data"],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("Query invalidation", () => {
    it("should invalidate queries after establishing trust", async () => {
      const mockChain = createMockTrustChain();
      vi.mocked(trustApi.establishTrust).mockResolvedValue(mockChain);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useEstablishTrust(), { wrapper });

      const request: EstablishTrustRequest = {
        agent_id: "agent-123",
        authority_id: "authority-org-1",
        capabilities: [],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["trustChains"],
      });
    });

    it("should set query data after establishing trust", async () => {
      const mockChain = createMockTrustChain();
      vi.mocked(trustApi.establishTrust).mockResolvedValue(mockChain);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useEstablishTrust(), { wrapper });

      const request: EstablishTrustRequest = {
        agent_id: "agent-123",
        authority_id: "authority-org-1",
        capabilities: [],
      };

      result.current.mutate(request);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["trustChain", mockChain.genesis.agent_id],
        mockChain
      );
    });
  });
});
