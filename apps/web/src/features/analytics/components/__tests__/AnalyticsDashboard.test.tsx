import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsDashboard } from "../AnalyticsDashboard";

// Mock the hooks
vi.mock("../../hooks", () => ({
  useExecutionMetrics: () => ({
    data: [
      { timestamp: "2024-01-01T00:00:00Z", value: 100 },
      { timestamp: "2024-01-02T00:00:00Z", value: 150 },
    ],
    isPending: false,
  }),
  useApiUsageMetrics: () => ({
    data: [
      { timestamp: "2024-01-01T00:00:00Z", value: 1000 },
      { timestamp: "2024-01-02T00:00:00Z", value: 1200 },
    ],
    isPending: false,
  }),
  useSuccessRateMetrics: () => ({
    data: [
      { timestamp: "2024-01-01T00:00:00Z", value: 95 },
      { timestamp: "2024-01-02T00:00:00Z", value: 96 },
    ],
    isPending: false,
  }),
  useAgentPerformance: () => ({
    data: {
      labels: ["Agent A", "Agent B"],
      datasets: [
        { label: "Executions", data: [100, 150], color: "hsl(var(--chart-1))" },
      ],
    },
    isPending: false,
  }),
  useDeploymentDistribution: () => ({
    data: [
      { name: "Production", value: 45, percentage: 45 },
      { name: "Staging", value: 30, percentage: 30 },
    ],
    isPending: false,
  }),
  useMetricsSummary: () => ({
    data: [
      {
        name: "Total Executions",
        value: 45678,
        change: 12.5,
        trend: "up" as const,
      },
      { name: "Success Rate", value: 94.3, change: 2.1, trend: "up" as const },
    ],
    isPending: false,
  }),
  useErrorDistribution: () => ({
    data: [
      { name: "Timeout", value: 45, percentage: 45 },
      { name: "Authentication", value: 28, percentage: 28 },
    ],
    isPending: false,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("AnalyticsDashboard", () => {
  it("renders dashboard header", () => {
    renderWithClient(<AnalyticsDashboard />);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Monitor your agents, executions, and performance metrics"
      )
    ).toBeInTheDocument();
  });

  it("renders export button", () => {
    renderWithClient(<AnalyticsDashboard />);
    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  it("renders time range selector", () => {
    renderWithClient(<AnalyticsDashboard />);
    expect(
      screen.getByRole("button", { name: /last 30 days/i })
    ).toBeInTheDocument();
  });

  it("renders key metrics summary", () => {
    renderWithClient(<AnalyticsDashboard />);
    expect(screen.getByText("Total Executions")).toBeInTheDocument();
    const successRateElements = screen.getAllByText("Success Rate");
    expect(successRateElements.length).toBeGreaterThan(0);
  });

  it("renders chart cards", () => {
    renderWithClient(<AnalyticsDashboard />);
    expect(screen.getByText("Execution Metrics")).toBeInTheDocument();
    expect(screen.getByText("API Usage")).toBeInTheDocument();
    const successRateElements = screen.getAllByText("Success Rate");
    expect(successRateElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Agent Performance")).toBeInTheDocument();
    expect(screen.getByText("Deployment Distribution")).toBeInTheDocument();
    expect(screen.getByText("Error Distribution")).toBeInTheDocument();
  });

  it("renders charts with data", () => {
    const { container } = renderWithClient(<AnalyticsDashboard />);
    const charts = container.querySelectorAll(".recharts-wrapper");
    expect(charts.length).toBeGreaterThan(0);
  });
});
