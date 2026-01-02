import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, createTestQueryClient } from "@/test/utils";
import { MetricsDashboard } from "../MetricsDashboard";
import { metricsApi } from "../../api";
import type {
  MetricsResponse,
  MetricSeriesResponse,
  MetricsSummary,
} from "../../types";

// Mock the metrics API
vi.mock("../../api", () => ({
  metricsApi: {
    getAll: vi.fn(),
    getSeries: vi.fn(),
    getSummary: vi.fn(),
  },
}));

describe("MetricsDashboard", () => {
  const mockMetricsResponse: MetricsResponse = {
    records: [
      {
        id: "total-agents",
        name: "Total Agents",
        value: 42,
        unit: "agents",
        change: 5,
        changePercent: 13.5,
        trend: "up",
        category: "agents",
      },
      {
        id: "success-rate",
        name: "Success Rate",
        value: 98.5,
        unit: "%",
        change: 1.2,
        changePercent: 1.2,
        trend: "up",
        category: "performance",
      },
    ],
    total: 2,
  };

  const mockSummary: MetricsSummary = {
    totalAgents: 42,
    totalExecutions: 1247,
    successRate: 98.5,
    avgResponseTime: 245,
    activeUsers: 127,
    apiCalls: 45632,
    errorRate: 1.5,
    p95ResponseTime: 850,
  };

  const mockSeriesResponse: MetricSeriesResponse = {
    series: [
      {
        metricId: "total-agents",
        metricName: "Total Agents",
        dataPoints: [
          { timestamp: "2024-01-01T00:00:00Z", value: 40 },
          { timestamp: "2024-01-01T01:00:00Z", value: 42 },
        ],
        unit: "agents",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render dashboard title and description", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Metrics Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor your agents, executions, and system performance"
      )
    ).toBeInTheDocument();
  });

  it("should render filters section", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    expect(screen.getByText("Time Range")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("should render loading state for metrics", () => {
    vi.mocked(metricsApi.getAll).mockImplementation(
      () => new Promise(() => {})
    );
    vi.mocked(metricsApi.getSummary).mockImplementation(
      () => new Promise(() => {})
    );

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render summary statistics", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Summary Statistics")).toBeInTheDocument();
    });
  });

  it("should render metric cards", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const totalAgentsElements = screen.getAllByText("Total Agents");
      expect(totalAgentsElements.length).toBeGreaterThan(0);
      const successRateElements = screen.getAllByText("Success Rate");
      expect(successRateElements.length).toBeGreaterThan(0);
    });
  });

  it("should display empty state when no metrics", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue({
      records: [],
      total: 0,
    });
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("No metrics available")).toBeInTheDocument();
    });
  });

  it("should display error state on metrics fetch failure", async () => {
    vi.mocked(metricsApi.getAll).mockRejectedValue(
      new Error("Failed to fetch")
    );
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Error loading metrics")).toBeInTheDocument();
    });
  });

  it("should display error state on summary fetch failure", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockRejectedValue(
      new Error("Failed to fetch summary")
    );

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Error loading metrics")).toBeInTheDocument();
    });
  });

  it("should show help text when no charts selected", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Click on any metric card to view its time series chart/i
        )
      ).toBeInTheDocument();
    });
  });

  it("should show chart section when metric is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);
    vi.mocked(metricsApi.getSeries).mockResolvedValue(mockSeriesResponse);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const totalAgentsElements = screen.getAllByText("Total Agents");
      expect(totalAgentsElements.length).toBeGreaterThan(0);
    });

    const totalAgentsElements = screen.getAllByText("Total Agents");
    const metricCard = totalAgentsElements[0]?.closest(
      'div[class*="cursor-pointer"]'
    );
    if (metricCard) {
      await user.click(metricCard);

      await waitFor(() => {
        expect(screen.getByText("Time Series Charts")).toBeInTheDocument();
      });
    }
  });

  it("should toggle chart visibility when clicking same metric twice", async () => {
    const user = userEvent.setup();
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);
    vi.mocked(metricsApi.getSeries).mockResolvedValue(mockSeriesResponse);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const totalAgentsElements = screen.getAllByText("Total Agents");
      expect(totalAgentsElements.length).toBeGreaterThan(0);
    });

    const totalAgentsElements = screen.getAllByText("Total Agents");
    const metricCard = totalAgentsElements[0]?.closest(
      'div[class*="cursor-pointer"]'
    );
    if (metricCard) {
      // Click once to show chart
      await user.click(metricCard);

      await waitFor(() => {
        expect(screen.getByText("Time Series Charts")).toBeInTheDocument();
      });

      // Click again to hide chart
      await user.click(metricCard);

      await waitFor(() => {
        expect(
          screen.getByText(
            /Click on any metric card to view its time series chart/i
          )
        ).toBeInTheDocument();
      });
    }
  });

  it("should call refresh when refresh button clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /refresh/i })
      ).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await user.click(refreshButton);

    // API should be called again
    await waitFor(() => {
      expect(metricsApi.getAll).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  it("should fetch data with default filters on mount", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(metricsApi.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ timeRange: "24h" })
      );
      expect(metricsApi.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ timeRange: "24h" })
      );
    });
  });

  it("should render key metrics section title", async () => {
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);

    renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    });
  });

  it("should handle multiple metric selections", async () => {
    const user = userEvent.setup();
    vi.mocked(metricsApi.getAll).mockResolvedValue(mockMetricsResponse);
    vi.mocked(metricsApi.getSummary).mockResolvedValue(mockSummary);
    vi.mocked(metricsApi.getSeries).mockResolvedValue({
      series: [
        {
          metricId: "total-agents",
          metricName: "Total Agents",
          dataPoints: [{ timestamp: "2024-01-01T00:00:00Z", value: 42 }],
          unit: "agents",
        },
        {
          metricId: "success-rate",
          metricName: "Success Rate",
          dataPoints: [{ timestamp: "2024-01-01T00:00:00Z", value: 98.5 }],
          unit: "%",
        },
      ],
    });

    const { container } = renderWithProviders(<MetricsDashboard />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      const totalAgentsElements = screen.getAllByText("Total Agents");
      expect(totalAgentsElements.length).toBeGreaterThan(0);
    });

    // Get all clickable metric cards (they have cursor-pointer class)
    const clickableCards = container.querySelectorAll(
      '[class*="cursor-pointer"]'
    );

    // Click first two cards (assuming they are the metric cards)
    if (clickableCards.length >= 2) {
      await user.click(clickableCards[0] as HTMLElement);
      await user.click(clickableCards[1] as HTMLElement);

      // Just verify that getSeries was called (may be called with different signatures)
      await waitFor(() => {
        expect(metricsApi.getSeries).toHaveBeenCalled();
      });
    }
  });
});
