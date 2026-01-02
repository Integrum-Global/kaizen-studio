import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { WebhookList } from "../WebhookList";
import { webhooksApi } from "../../api";
import type { Webhook } from "../../types";

// Mock the webhooks API
vi.mock("../../api", () => ({
  webhooksApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    test: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe("WebhookList", () => {
  const createMockWebhook = (overrides?: Partial<Webhook>): Webhook => ({
    id: `webhook-${Math.random()}`,
    organization_id: "org-123",
    name: "Test Webhook",
    url: "https://example.com/webhook",
    events: ["agent.created", "agent.updated"],
    status: "active",
    failure_count: 0,
    created_by: "user-123",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it("should render loading state", () => {
    vi.mocked(webhooksApi.getAll).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no webhooks", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No webhooks found")).toBeInTheDocument();
    });
  });

  it("should show create button in empty state", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const createButtons = screen.getAllByText("Create Webhook");
      expect(createButtons.length).toBeGreaterThan(0);
    });
  });

  it("should render webhooks correctly", async () => {
    const webhooks = [
      createMockWebhook({ name: "Production Webhook" }),
      createMockWebhook({ name: "Staging Webhook" }),
      createMockWebhook({ name: "Development Webhook" }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Production Webhook")).toBeInTheDocument();
      expect(screen.getByText("Staging Webhook")).toBeInTheDocument();
      expect(screen.getByText("Development Webhook")).toBeInTheDocument();
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(webhooksApi.getAll).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load webhooks")).toBeInTheDocument();
    });
  });

  it("should call webhooksApi.getAll on mount", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([createMockWebhook()]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(webhooksApi.getAll).toHaveBeenCalled();
    });
  });

  it("should show create webhook button in header", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getAllByText("Create Webhook").length).toBeGreaterThan(0);
    });
  });

  it("should display different webhook statuses", async () => {
    const webhooks = [
      createMockWebhook({ name: "Active Webhook", status: "active" }),
      createMockWebhook({ name: "Inactive Webhook", status: "inactive" }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("inactive")).toBeInTheDocument();
    });
  });

  it("should render grid layout for webhooks", async () => {
    const webhooks = Array.from({ length: 3 }, (_, i) =>
      createMockWebhook({ name: `Webhook ${i + 1}` })
    );
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    const { container } = renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  it("should show skeleton cards during loading", () => {
    vi.mocked(webhooksApi.getAll).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should display webhooks with failure counts", async () => {
    const webhooks = [
      createMockWebhook({ name: "Failed Webhook", failure_count: 5 }),
      createMockWebhook({ name: "Healthy Webhook", failure_count: 0 }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("5 failures")).toBeInTheDocument();
      expect(screen.getByText("Failed Webhook")).toBeInTheDocument();
      expect(screen.getByText("Healthy Webhook")).toBeInTheDocument();
    });
  });

  it("should display webhooks with different events", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Agent Events",
        events: ["agent.created", "agent.updated"],
      }),
      createMockWebhook({
        name: "Deployment Events",
        events: ["deployment.created", "deployment.deleted"],
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("agent.created")).toBeInTheDocument();
      expect(screen.getByText("agent.updated")).toBeInTheDocument();
      expect(screen.getByText("deployment.created")).toBeInTheDocument();
      expect(screen.getByText("deployment.deleted")).toBeInTheDocument();
    });
  });

  it("should show helper text in empty state", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Create your first webhook to get started")
      ).toBeInTheDocument();
    });
  });

  it("should display webhooks list header with description", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue([createMockWebhook()]);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Webhooks")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Configure webhooks to receive real-time event notifications"
        )
      ).toBeInTheDocument();
    });
  });

  it("should display last triggered date for webhooks that have been triggered", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Triggered Webhook",
        last_triggered_at: "2024-01-20T10:30:00Z",
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Last triggered/i)).toBeInTheDocument();
    });
  });

  it("should display webhook URLs", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Production Webhook",
        url: "https://prod.example.com/webhook",
      }),
      createMockWebhook({
        name: "Staging Webhook",
        url: "https://staging.example.com/webhook",
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText("https://prod.example.com/webhook")
      ).toBeInTheDocument();
      expect(
        screen.getByText("https://staging.example.com/webhook")
      ).toBeInTheDocument();
    });
  });

  it("should render 6 skeleton cards during loading", () => {
    vi.mocked(webhooksApi.getAll).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    // Check for grid containing skeletons
    const grid = document.querySelector('[class*="grid"]');
    expect(grid).toBeInTheDocument();

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(5); // Should have 6+ skeletons
  });

  it("should display webhooks in grid layout with correct responsive classes", async () => {
    const webhooks = Array.from({ length: 6 }, (_, i) =>
      createMockWebhook({ name: `Webhook ${i + 1}` })
    );
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    const { container } = renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const grid = container.querySelector(
        '[class*="grid-cols-1"][class*="md:grid-cols-2"][class*="lg:grid-cols-3"]'
      );
      expect(grid).toBeInTheDocument();
    });
  });

  it("should handle empty webhook data gracefully", async () => {
    vi.mocked(webhooksApi.getAll).mockResolvedValue(null as any);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No webhooks found")).toBeInTheDocument();
    });
  });

  it("should display created dates for all webhooks", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Webhook 1",
        created_at: "2024-01-15T10:30:00Z",
      }),
      createMockWebhook({
        name: "Webhook 2",
        created_at: "2024-02-20T14:45:00Z",
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const createdTexts = screen.getAllByText(/Created/i);
      expect(createdTexts.length).toBeGreaterThan(0);
    });
  });

  it("should show webhooks with zero failure count", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Healthy Webhook",
        failure_count: 0,
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Healthy Webhook")).toBeInTheDocument();
      // Should not show failure count badge
      expect(screen.queryByText(/failures/)).not.toBeInTheDocument();
    });
  });

  it("should display multiple webhooks with various configurations", async () => {
    const webhooks = [
      createMockWebhook({
        name: "Webhook 1",
        status: "active",
        failure_count: 0,
        events: ["agent.created"],
      }),
      createMockWebhook({
        name: "Webhook 2",
        status: "inactive",
        failure_count: 3,
        events: ["agent.updated", "agent.deleted"],
      }),
      createMockWebhook({
        name: "Webhook 3",
        status: "active",
        failure_count: 1,
        events: ["deployment.created"],
        last_triggered_at: "2024-01-20T10:30:00Z",
      }),
    ];
    vi.mocked(webhooksApi.getAll).mockResolvedValue(webhooks);

    renderWithProviders(<WebhookList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Webhook 1")).toBeInTheDocument();
      expect(screen.getByText("Webhook 2")).toBeInTheDocument();
      expect(screen.getByText("Webhook 3")).toBeInTheDocument();
      expect(screen.getByText("3 failures")).toBeInTheDocument();
      expect(screen.getByText("1 failures")).toBeInTheDocument();
    });
  });
});
