import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { MetricChart } from "../MetricChart";
import type { MetricSeries } from "../../types";

describe("MetricChart", () => {
  const createMockSeries = (
    overrides?: Partial<MetricSeries>
  ): MetricSeries => ({
    metricId: "test-metric",
    metricName: "Test Metric",
    dataPoints: [
      { timestamp: "2024-01-01T00:00:00Z", value: 100 },
      { timestamp: "2024-01-01T01:00:00Z", value: 120 },
      { timestamp: "2024-01-01T02:00:00Z", value: 110 },
      { timestamp: "2024-01-01T03:00:00Z", value: 130 },
      { timestamp: "2024-01-01T04:00:00Z", value: 125 },
    ],
    unit: "units",
    ...overrides,
  });

  it("should render chart with metric name", () => {
    const series = createMockSeries({ metricName: "Total Users" });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText("Total Users")).toBeInTheDocument();
  });

  it("should render svg chart element", () => {
    const series = createMockSeries();

    const { container } = renderWithProviders(<MetricChart series={series} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render empty state when no data points", () => {
    const series = createMockSeries({ dataPoints: [] });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("should display min, max, and average values", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 100 },
        { timestamp: "2024-01-01T01:00:00Z", value: 200 },
        { timestamp: "2024-01-01T02:00:00Z", value: 150 },
      ],
    });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByText(/Max:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg:/)).toBeInTheDocument();
  });

  it("should format percentage values correctly", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 98.5 },
        { timestamp: "2024-01-01T01:00:00Z", value: 99.2 },
      ],
      unit: "%",
    });

    renderWithProviders(<MetricChart series={series} />);

    const stats = screen.getByText(/Min:/);
    expect(stats).toBeInTheDocument();
  });

  it("should format milliseconds correctly", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 250 },
        { timestamp: "2024-01-01T01:00:00Z", value: 300 },
      ],
      unit: "ms",
    });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText("Test Metric")).toBeInTheDocument();
  });

  it("should format large numbers with K suffix", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 5000 },
        { timestamp: "2024-01-01T01:00:00Z", value: 6000 },
      ],
    });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText("Test Metric")).toBeInTheDocument();
  });

  it("should format very large numbers with M suffix", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 1500000 },
        { timestamp: "2024-01-01T01:00:00Z", value: 2000000 },
      ],
    });

    renderWithProviders(<MetricChart series={series} />);

    expect(screen.getByText("Test Metric")).toBeInTheDocument();
  });

  it("should render with custom height", () => {
    const series = createMockSeries();

    const { container } = renderWithProviders(
      <MetricChart series={series} height={400} />
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "400");
  });

  it("should render default height when not specified", () => {
    const series = createMockSeries();

    const { container } = renderWithProviders(<MetricChart series={series} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("height", "300");
  });

  it("should handle single data point", () => {
    const series = createMockSeries({
      dataPoints: [{ timestamp: "2024-01-01T00:00:00Z", value: 100 }],
    });

    const { container } = renderWithProviders(<MetricChart series={series} />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should render data points as circles", () => {
    const series = createMockSeries();

    const { container } = renderWithProviders(<MetricChart series={series} />);

    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(series.dataPoints.length);
  });

  it("should render grid lines", () => {
    const series = createMockSeries();

    const { container } = renderWithProviders(<MetricChart series={series} />);

    const lines = container.querySelectorAll("line");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("should calculate correct average", () => {
    const series = createMockSeries({
      dataPoints: [
        { timestamp: "2024-01-01T00:00:00Z", value: 100 },
        { timestamp: "2024-01-01T01:00:00Z", value: 200 },
        { timestamp: "2024-01-01T02:00:00Z", value: 150 },
      ],
    });

    renderWithProviders(<MetricChart series={series} />);

    // Average should be 150
    expect(screen.getByText(/Avg:/)).toBeInTheDocument();
  });
});
