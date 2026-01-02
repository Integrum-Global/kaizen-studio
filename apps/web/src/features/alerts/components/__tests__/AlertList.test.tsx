import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { AlertList } from "../AlertList";
import { alertsApi } from "../../api";
import type { Alert, AlertResponse } from "../../types";

// Mock the alerts API
vi.mock("../../api", () => ({
  alertsApi: {
    getAll: vi.fn(),
    acknowledge: vi.fn(),
    resolve: vi.fn(),
  },
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("AlertList", () => {
  const createMockAlert = (overrides?: Partial<Alert>): Alert => ({
    id: `alert-${Math.random()}`,
    name: "Test Alert",
    description: "A test alert description",
    severity: "warning",
    status: "active",
    metric: "cpu_usage",
    condition: "cpu_usage > 80%",
    threshold: 80,
    current_value: 85,
    rule_id: "rule-1",
    triggered_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    vi.mocked(alertsApi.getAll).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    // Should show skeletons
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no alerts", async () => {
    const mockResponse: AlertResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No alerts found")).toBeInTheDocument();
    });
  });

  it("should render alerts correctly", async () => {
    const alerts = [
      createMockAlert({ name: "Alert A", severity: "critical" }),
      createMockAlert({ name: "Alert B", severity: "warning" }),
      createMockAlert({ name: "Alert C", severity: "info" }),
    ];
    const mockResponse: AlertResponse = {
      records: alerts,
      total: 3,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Alert A")).toBeInTheDocument();
      expect(screen.getByText("Alert B")).toBeInTheDocument();
      expect(screen.getByText("Alert C")).toBeInTheDocument();
    });
  });

  it("should filter by search query", async () => {
    const user = userEvent.setup();
    const alerts = [
      createMockAlert({ name: "CPU Alert" }),
      createMockAlert({ name: "Memory Alert" }),
    ];
    const mockResponse: AlertResponse = {
      records: alerts,
      total: 2,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("CPU Alert")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search alerts...");
    await user.type(searchInput, "CPU");

    await waitFor(() => {
      expect(alertsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "CPU" })
      );
    });
  });

  it("should toggle filters section", async () => {
    const user = userEvent.setup();
    const mockResponse: AlertResponse = {
      records: [createMockAlert()],
      total: 1,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Test Alert")).toBeInTheDocument();
    });

    // Filters should not be visible initially
    expect(screen.queryByText("All Severities")).not.toBeInTheDocument();

    // Click filters button
    const filtersButton = screen.getByRole("button", { name: /filters/i });
    await user.click(filtersButton);

    // Filters should now be visible
    await waitFor(() => {
      expect(screen.getByText("Severity")).toBeInTheDocument();
    });
  });

  it("should handle pagination", async () => {
    const user = userEvent.setup();
    const alerts = Array.from({ length: 12 }, (_, i) =>
      createMockAlert({ name: `Alert ${i + 1}` })
    );
    const mockResponse: AlertResponse = {
      records: alerts,
      total: 24,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(alertsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it("should show error state on fetch failure", async () => {
    vi.mocked(alertsApi.getAll).mockRejectedValue(new Error("Network error"));

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load alerts")).toBeInTheDocument();
    });
  });

  it("should call alertsApi.getAll on mount", async () => {
    const mockResponse: AlertResponse = {
      records: [createMockAlert()],
      total: 1,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(alertsApi.getAll).toHaveBeenCalled();
    });
  });

  it("should show create rule button when provided", async () => {
    const mockResponse: AlertResponse = {
      records: [],
      total: 0,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    const onCreateRule = vi.fn();
    renderWithProviders(<AlertList onCreateRule={onCreateRule} />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Create Alert Rule")).toBeInTheDocument();
    });
  });

  it("should display severity badges", async () => {
    const alerts = [
      createMockAlert({ name: "Critical Alert", severity: "critical" }),
      createMockAlert({ name: "Warning Alert", severity: "warning" }),
      createMockAlert({ name: "Info Alert", severity: "info" }),
    ];
    const mockResponse: AlertResponse = {
      records: alerts,
      total: 3,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Critical")).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("Info")).toBeInTheDocument();
    });
  });

  it("should display alert statuses", async () => {
    const alerts = [
      createMockAlert({ name: "Active Alert", status: "active" }),
      createMockAlert({ name: "Ack Alert", status: "acknowledged" }),
      createMockAlert({ name: "Resolved Alert", status: "resolved" }),
    ];
    const mockResponse: AlertResponse = {
      records: alerts,
      total: 3,
    };
    vi.mocked(alertsApi.getAll).mockResolvedValue(mockResponse);

    renderWithProviders(<AlertList />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Acknowledged")).toBeInTheDocument();
      expect(screen.getByText("Resolved")).toBeInTheDocument();
    });
  });
});
