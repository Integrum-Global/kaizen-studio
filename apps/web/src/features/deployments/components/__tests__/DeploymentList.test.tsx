import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { DeploymentList } from "../DeploymentList";
import { deploymentsApi } from "../../api";
import type { Deployment, DeploymentResponse } from "../../types";

// Mock the deployments API
vi.mock("../../api", () => ({
  deploymentsApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("DeploymentList", () => {
  const createMockDeployment = (
    overrides?: Partial<Deployment>
  ): Deployment => ({
    id: `deployment-${Math.random()}`,
    pipelineId: "pipeline-123",
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
      environment: {},
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(deploymentsApi.getAll).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no deployments", async () => {
    const mockResponse: DeploymentResponse = {
      deployments: [],
      total: 0,
      page: 1,
      page_size: 12,
    };
    vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No deployments found")).toBeInTheDocument();
    });
  });

  it("should render deployments correctly", async () => {
    const deployments = [
      createMockDeployment({ pipelineName: "Pipeline A" }),
      createMockDeployment({ pipelineName: "Pipeline B" }),
      createMockDeployment({ pipelineName: "Pipeline C" }),
    ];
    const mockResponse: DeploymentResponse = {
      deployments,
      total: 3,
      page: 1,
      page_size: 12,
    };
    vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Pipeline A")).toBeInTheDocument();
      expect(screen.getByText("Pipeline B")).toBeInTheDocument();
      expect(screen.getByText("Pipeline C")).toBeInTheDocument();
    });
  });

  it("should filter by search query", async () => {
    const user = userEvent.setup();
    const deployments = [
      createMockDeployment({ pipelineName: "Production API" }),
      createMockDeployment({ pipelineName: "Staging API" }),
    ];
    const mockResponse: DeploymentResponse = {
      deployments,
      total: 2,
      page: 1,
      page_size: 12,
    };
    vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Production API")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search deployments...");
    await user.type(searchInput, "Production");

    await waitFor(() => {
      expect(deploymentsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Production" })
      );
    });
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const deployments = Array.from({ length: 12 }, (_, i) =>
      createMockDeployment({ pipelineName: `Pipeline ${i + 1}` })
    );
    const mockResponse: DeploymentResponse = {
      deployments,
      total: 24,
      page: 1,
      page_size: 12,
    };
    vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(deploymentsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(deploymentsApi.getAll).mockRejectedValue(
      new Error("Network error")
    );

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load deployments")
      ).toBeInTheDocument();
    });
  });

  it("should call deploymentsApi.getAll on mount", async () => {
    const mockResponse: DeploymentResponse = {
      deployments: [createMockDeployment()],
      total: 1,
      page: 1,
      page_size: 12,
    };
    vi.mocked(deploymentsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<DeploymentList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(deploymentsApi.getAll).toHaveBeenCalled();
    });
  });
});
