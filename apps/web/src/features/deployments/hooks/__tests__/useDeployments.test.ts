import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useDeployments,
  useDeployment,
  useCreateDeployment,
  useUpdateDeployment,
  useDeleteDeployment,
  useStartDeployment,
  useStopDeployment,
} from "../useDeployments";
import { deploymentsApi } from "../../api";
import type {
  Deployment,
  CreateDeploymentInput,
  UpdateDeploymentInput,
  DeploymentResponse,
} from "../../types";

// Mock the deployments API
vi.mock("../../api", () => ({
  deploymentsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

// Helper to create mock deployment
function createMockDeployment(overrides?: Partial<Deployment>): Deployment {
  return {
    id: "deployment-123",
    pipelineId: "pipeline-456",
    pipelineName: "Test Pipeline",
    version: "1.0.0",
    environment: "development",
    status: "active",
    endpoint: "https://api.example.com/deploy-123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    createdBy: "user-789",
    config: {
      replicas: 2,
      maxConcurrency: 10,
      timeout: 300,
      retries: 3,
      environment: {
        NODE_ENV: "development",
        API_KEY: "secret",
      },
    },
    ...overrides,
  };
}

// Helper to create test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

describe("Deployment Hooks", () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  }

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe("useDeployments", () => {
    it("should fetch all deployments", async () => {
      const mockDeployments: DeploymentResponse = {
        deployments: [
          createMockDeployment(),
          createMockDeployment({ id: "deployment-456" }),
        ],
        total: 2,
        page: 1,
        page_size: 12,
      };

      vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockDeployments);

      const { result } = renderHook(() => useDeployments(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.getAll).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockDeployments);
    });

    it("should fetch deployments with filters", async () => {
      const mockDeployments: DeploymentResponse = {
        deployments: [createMockDeployment({ environment: "production" })],
        total: 1,
        page: 1,
        page_size: 12,
      };

      const filters = {
        environment: "production" as const,
        status: "active" as const,
      };
      vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockDeployments);

      const { result } = renderHook(() => useDeployments(filters), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.getAll).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual(mockDeployments);
    });

    it("should handle fetch error", async () => {
      const error = new Error("Network error");
      vi.mocked(deploymentsApi.getAll).mockRejectedValue(error);

      const { result } = renderHook(() => useDeployments(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useDeployment", () => {
    it("should fetch a single deployment by ID", async () => {
      const mockDeployment = createMockDeployment();

      vi.mocked(deploymentsApi.getById).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useDeployment("deployment-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.getById).toHaveBeenCalledWith("deployment-123");
      expect(result.current.data).toEqual(mockDeployment);
    });

    it("should not fetch when ID is empty", () => {
      const { result } = renderHook(() => useDeployment(""), { wrapper });

      expect(deploymentsApi.getById).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it("should handle fetch error", async () => {
      const error = new Error("Deployment not found");
      vi.mocked(deploymentsApi.getById).mockRejectedValue(error);

      const { result } = renderHook(() => useDeployment("deployment-123"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useCreateDeployment", () => {
    it("should create a new deployment", async () => {
      const mockDeployment = createMockDeployment();
      const input: CreateDeploymentInput = {
        pipelineId: "pipeline-456",
        environment: "development",
        config: {
          replicas: 2,
          maxConcurrency: 10,
          timeout: 300,
          retries: 3,
          environment: {},
        },
      };

      vi.mocked(deploymentsApi.create).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useCreateDeployment(), { wrapper });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.create).toHaveBeenCalledWith(input);
      expect(result.current.data).toEqual(mockDeployment);
    });

    it("should invalidate deployment list on success", async () => {
      const mockDeployment = createMockDeployment();
      const input: CreateDeploymentInput = {
        pipelineId: "pipeline-456",
        environment: "development",
        config: {
          replicas: 1,
          maxConcurrency: 5,
          timeout: 300,
          retries: 3,
          environment: {},
        },
      };

      vi.mocked(deploymentsApi.create).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useCreateDeployment(), { wrapper });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Check that the query cache was updated
      const cachedData = queryClient.getQueryData([
        "deployments",
        "detail",
        mockDeployment.id,
      ]);
      expect(cachedData).toEqual(mockDeployment);
    });

    it("should handle create error", async () => {
      const error = new Error("Failed to create deployment");
      const input: CreateDeploymentInput = {
        pipelineId: "pipeline-456",
        environment: "development",
        config: {
          replicas: 1,
          maxConcurrency: 5,
          timeout: 300,
          retries: 3,
          environment: {},
        },
      };

      vi.mocked(deploymentsApi.create).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateDeployment(), { wrapper });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useUpdateDeployment", () => {
    it("should update a deployment", async () => {
      const mockDeployment = createMockDeployment({
        config: { ...createMockDeployment().config, replicas: 5 },
      });
      const input: UpdateDeploymentInput = {
        config: {
          replicas: 5,
        },
      };

      vi.mocked(deploymentsApi.update).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useUpdateDeployment(), { wrapper });

      result.current.mutate({ id: "deployment-123", input });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.update).toHaveBeenCalledWith(
        "deployment-123",
        input
      );
      expect(result.current.data).toEqual(mockDeployment);
    });

    it("should handle update error", async () => {
      const error = new Error("Failed to update deployment");
      const input: UpdateDeploymentInput = {
        config: {
          replicas: 5,
        },
      };

      vi.mocked(deploymentsApi.update).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateDeployment(), { wrapper });

      result.current.mutate({ id: "deployment-123", input });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useDeleteDeployment", () => {
    it("should delete a deployment", async () => {
      vi.mocked(deploymentsApi.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.delete).toHaveBeenCalledWith("deployment-123");
    });

    it("should handle delete error", async () => {
      const error = new Error("Failed to delete deployment");
      vi.mocked(deploymentsApi.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useStartDeployment", () => {
    it("should start a deployment", async () => {
      const mockDeployment = createMockDeployment({ status: "deploying" });

      vi.mocked(deploymentsApi.start).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useStartDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.start).toHaveBeenCalledWith("deployment-123");
      expect(result.current.data).toEqual(mockDeployment);
    });

    it("should handle start error", async () => {
      const error = new Error("Failed to start deployment");
      vi.mocked(deploymentsApi.start).mockRejectedValue(error);

      const { result } = renderHook(() => useStartDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe("useStopDeployment", () => {
    it("should stop a deployment", async () => {
      const mockDeployment = createMockDeployment({ status: "stopped" });

      vi.mocked(deploymentsApi.stop).mockResolvedValue(mockDeployment);

      const { result } = renderHook(() => useStopDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(deploymentsApi.stop).toHaveBeenCalledWith("deployment-123");
      expect(result.current.data).toEqual(mockDeployment);
    });

    it("should handle stop error", async () => {
      const error = new Error("Failed to stop deployment");
      vi.mocked(deploymentsApi.stop).mockRejectedValue(error);

      const { result } = renderHook(() => useStopDeployment(), { wrapper });

      result.current.mutate("deployment-123");

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});
