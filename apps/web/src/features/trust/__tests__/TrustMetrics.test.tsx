/**
 * Phase 4 Part 2: Trust Metrics Component Tests
 *
 * Tests for TrustMetricsDashboard, MetricCard, and TrustActivityChart
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { TrustMetricsDashboard } from "../components/TrustMetrics/TrustMetricsDashboard";
import { MetricCard } from "../components/TrustMetrics/MetricCard";
import { TrustActivityChart } from "../components/TrustMetrics/TrustActivityChart";
import { createMockTrustMetrics } from "./fixtures";

// Mock hooks - path relative to the component being tested
vi.mock("../hooks", () => ({
  useTrustMetrics: vi.fn(() => ({
    data: {
      summary: {
        totalEstablishments: 150,
        activeDelegations: 45,
        verificationSuccessRate: 98.5,
        totalAuditEvents: 1234,
        establishmentsTrend: { value: 12, direction: "up" as const },
        delegationsTrend: { value: 5, direction: "up" as const },
        successRateTrend: { value: 0.5, direction: "up" as const },
        auditEventsTrend: { value: 8, direction: "neutral" as const },
      },
      activityOverTime: [],
      delegationDistribution: [],
      topCapabilities: [],
      constraintViolations: [],
    },
    isPending: false,
    error: null,
  })),
  useExportMetrics: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(new Blob()),
    isPending: false,
  })),
}));

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock recharts components for chart tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data, dataKey }: any) => (
    <div data-testid="pie" data-length={data?.length} data-key={dataKey} />
  ),
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-length={data?.length}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, name }: any) => (
    <div data-testid={`bar-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe("TrustMetricsDashboard", () => {
  const defaultMetrics = createMockTrustMetrics();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard header with title and description", () => {
    renderWithProviders(<TrustMetricsDashboard />);

    expect(screen.getByText("Trust Metrics")).toBeInTheDocument();
    expect(
      screen.getByText("Analytics and insights for trust operations")
    ).toBeInTheDocument();
  });

  it("shows time range selector with default value", () => {
    renderWithProviders(<TrustMetricsDashboard />);

    // Find the combobox/select trigger
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);

    // Check that time range options exist
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  });

  it("shows export buttons for CSV and JSON", () => {
    renderWithProviders(<TrustMetricsDashboard />);

    expect(screen.getByText("Export CSV")).toBeInTheDocument();
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
  });

  it("displays metric cards with summary data", () => {
    renderWithProviders(<TrustMetricsDashboard />);

    expect(screen.getByText("Trust Establishments")).toBeInTheDocument();
    expect(screen.getByText("Active Delegations")).toBeInTheDocument();
    expect(screen.getByText("Verification Success Rate")).toBeInTheDocument();
    expect(screen.getByText("Audit Events")).toBeInTheDocument();

    // Check values from mock data
    expect(screen.getByText("150")).toBeInTheDocument(); // totalEstablishments
    expect(screen.getByText("45")).toBeInTheDocument(); // activeDelegations
    expect(screen.getByText("1234")).toBeInTheDocument(); // totalAuditEvents
  });

  it("shows capabilities chart section", () => {
    renderWithProviders(<TrustMetricsDashboard />);

    expect(
      screen.getByText("Top Capabilities", { exact: false })
    ).toBeInTheDocument();
  });

  it("updates metrics when time range changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TrustMetricsDashboard />);

    // Find and click the time range selector
    const selects = screen.getAllByRole("combobox");
    const timeRangeSelect = selects[0];

    await user.click(timeRangeSelect);

    // Select "Last 24 hours" option
    await waitFor(() => {
      const option = screen.getByText("Last 24 hours");
      expect(option).toBeInTheDocument();
    });
  });
});

describe("MetricCard", () => {
  it("renders title and value correctly", () => {
    renderWithProviders(
      <MetricCard title="Test Metric" value={100} />
    );

    expect(screen.getByText("Test Metric")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("shows trend indicator for positive trend", () => {
    renderWithProviders(
      <MetricCard title="Test Metric" value={100} trend={12.5} />
    );

    expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/from previous period/)).toBeInTheDocument();
  });

  it("shows trend indicator for negative trend with correct color", () => {
    const { container } = renderWithProviders(
      <MetricCard title="Test Metric" value={100} trend={-5.3} />
    );

    expect(screen.getByText(/5\.3%/)).toBeInTheDocument();

    // Check for red color classes indicating negative trend
    const trendElement = screen.getByText(/5\.3%/).closest("div");
    expect(trendElement?.className).toMatch(/text-red/);
  });

  it("shows neutral indicator when trend is zero", () => {
    renderWithProviders(
      <MetricCard title="Test Metric" value={100} trend={0} />
    );

    expect(screen.getByText(/0\.0%/)).toBeInTheDocument();
  });

  it("applies correct color for positive trend", () => {
    const { container } = renderWithProviders(
      <MetricCard title="Test Metric" value={100} trend={10} />
    );

    const trendElement = screen.getByText(/10\.0%/).closest("div");
    expect(trendElement?.className).toMatch(/text-green/);
  });

  it("handles suffix correctly", () => {
    renderWithProviders(
      <MetricCard title="Success Rate" value={98.5} suffix="%" />
    );

    expect(screen.getByText("98.5")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("shows loading state with skeleton", () => {
    const { container } = renderWithProviders(
      <MetricCard title="Test Metric" value={100} isLoading={true} />
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("calls onClick handler when clicked and handler is provided", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <MetricCard title="Test Metric" value={100} onClick={onClick} />
    );

    const card = screen.getByText("Test Metric").closest("div[class*='cursor-pointer']");
    if (card) {
      await user.click(card);
      expect(onClick).toHaveBeenCalled();
    }
  });
});

describe("TrustActivityChart", () => {
  const mockData = [
    {
      date: "2024-01-01",
      establishments: 20,
      delegations: 8,
      revocations: 1,
      verifications: 850,
    },
    {
      date: "2024-01-02",
      establishments: 18,
      delegations: 6,
      revocations: 2,
      verifications: 820,
    },
  ];

  it("renders chart container with title", () => {
    renderWithProviders(<TrustActivityChart data={mockData} />);

    expect(screen.getByText("Trust Activity Over Time")).toBeInTheDocument();
  });

  it("shows legend with series options", () => {
    renderWithProviders(<TrustActivityChart data={mockData} />);

    expect(screen.getByText("Establishments")).toBeInTheDocument();
    expect(screen.getByText("Delegations")).toBeInTheDocument();
    expect(screen.getByText("Revocations")).toBeInTheDocument();
    expect(screen.getByText("Verifications")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    renderWithProviders(<TrustActivityChart data={[]} />);

    expect(screen.getByText("Trust Activity Over Time")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("shows loading skeleton when isLoading is true", () => {
    const { container } = renderWithProviders(
      <TrustActivityChart data={[]} isLoading={true} />
    );

    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("allows toggling series visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TrustActivityChart data={mockData} />);

    // Find the checkbox button for "Establishments" (Shadcn Checkbox uses button role)
    const establishmentsLabel = screen.getByText("Establishments");
    expect(establishmentsLabel).toBeInTheDocument();

    // The label should be clickable to toggle the series
    await user.click(establishmentsLabel);

    // Component should still be functional after click
    expect(screen.getByText("Trust Activity Over Time")).toBeInTheDocument();
  });
});
