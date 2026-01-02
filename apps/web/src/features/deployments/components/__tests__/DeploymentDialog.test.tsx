import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { DeploymentDialog } from "../DeploymentDialog";
import type { Deployment } from "../../types";

// Mock the APIs
vi.mock("../../api", () => ({
  deploymentsApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../../pipelines/api", () => ({
  pipelinesApi: {
    getAll: vi.fn(() =>
      Promise.resolve({
        pipelines: [
          { id: "pipeline-1", name: "Pipeline 1", status: "active" },
          { id: "pipeline-2", name: "Pipeline 2", status: "active" },
        ],
        total: 2,
        page: 1,
        page_size: 100,
      })
    ),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("DeploymentDialog", () => {
  const mockOnOpenChange = vi.fn();

  const createMockDeployment = (
    overrides?: Partial<Deployment>
  ): Deployment => ({
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
      environment: {},
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("should render create dialog", () => {
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New Deployment")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create deployment/i })
      ).toBeInTheDocument();
    });

    it("should show form fields", () => {
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Check for form field labels
      expect(screen.getByText("Pipeline ID")).toBeInTheDocument();
      expect(screen.getByText("Environment")).toBeInTheDocument();
      expect(screen.getByText("Replicas")).toBeInTheDocument();
      expect(screen.getByText("Max Concurrency")).toBeInTheDocument();
      expect(screen.getByText("Timeout (seconds)")).toBeInTheDocument();
      expect(screen.getByText("Retries")).toBeInTheDocument();
    });

    it("should show default values", () => {
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      // Replicas default
      const replicasInput = screen.getByDisplayValue("1");
      expect(replicasInput).toBeInTheDocument();
    });

    it("should call onOpenChange when cancel is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Edit Mode", () => {
    it("should render edit dialog", () => {
      const deployment = createMockDeployment();
      renderWithProviders(
        <DeploymentDialog
          deployment={deployment}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { queryClient: createTestQueryClient() }
      );

      expect(
        screen.getByText("Edit Deployment Configuration")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /update configuration/i })
      ).toBeInTheDocument();
    });

    it("should show existing values", () => {
      const deployment = createMockDeployment({
        config: {
          replicas: 3,
          maxConcurrency: 20,
          timeout: 600,
          retries: 5,
          environment: {},
        },
      });
      renderWithProviders(
        <DeploymentDialog
          deployment={deployment}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { queryClient: createTestQueryClient() }
      );

      // Check existing values
      expect(screen.getByDisplayValue("3")).toBeInTheDocument(); // replicas
      expect(screen.getByDisplayValue("20")).toBeInTheDocument(); // maxConcurrency
      expect(screen.getByDisplayValue("600")).toBeInTheDocument(); // timeout
      expect(screen.getByDisplayValue("5")).toBeInTheDocument(); // retries
    });
  });

  describe("Form Interaction", () => {
    it("should update replicas input", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const replicasInput = screen.getByDisplayValue("1");
      await user.clear(replicasInput);
      await user.type(replicasInput, "5");

      expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    });

    it("should update timeout input", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      const timeoutInput = screen.getByDisplayValue("300");
      await user.clear(timeoutInput);
      await user.type(timeoutInput, "600");

      expect(screen.getByDisplayValue("600")).toBeInTheDocument();
    });
  });

  describe("Dialog Open/Close", () => {
    it("should not render when open is false", () => {
      renderWithProviders(
        <DeploymentDialog open={false} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(
        screen.queryByText("Create New Deployment")
      ).not.toBeInTheDocument();
    });

    it("should render when open is true", () => {
      renderWithProviders(
        <DeploymentDialog open={true} onOpenChange={mockOnOpenChange} />,
        { queryClient: createTestQueryClient() }
      );

      expect(screen.getByText("Create New Deployment")).toBeInTheDocument();
    });
  });
});
