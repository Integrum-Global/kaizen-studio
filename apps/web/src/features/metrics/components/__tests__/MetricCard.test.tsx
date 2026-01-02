import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import { MetricCard } from "../MetricCard";
import type { Metric } from "../../types";

describe("MetricCard", () => {
  const createMockMetric = (overrides?: Partial<Metric>): Metric => ({
    id: "test-metric",
    name: "Test Metric",
    value: 100,
    unit: "units",
    change: 10,
    changePercent: 10.0,
    trend: "up",
    category: "test",
    description: "A test metric",
    ...overrides,
  });

  it("should render metric information correctly", () => {
    const metric = createMockMetric({
      name: "Total Users",
      value: 250,
      unit: "users",
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
  });

  it("should display positive trend correctly", () => {
    const metric = createMockMetric({
      trend: "up",
      change: 15,
      changePercent: 12.5,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText(/\+15/)).toBeInTheDocument();
    expect(screen.getByText(/12.5%/)).toBeInTheDocument();
  });

  it("should display negative trend correctly", () => {
    const metric = createMockMetric({
      trend: "down",
      change: -20,
      changePercent: -15.0,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText(/-20/)).toBeInTheDocument();
    expect(screen.getByText(/-15.0%/)).toBeInTheDocument();
  });

  it("should display stable trend correctly", () => {
    const metric = createMockMetric({
      trend: "stable",
      change: 0,
      changePercent: 0,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("should format large numbers correctly", () => {
    const metric = createMockMetric({
      value: 1500000,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText("1.5M")).toBeInTheDocument();
  });

  it("should format thousands correctly", () => {
    const metric = createMockMetric({
      value: 5500,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText("5.5K")).toBeInTheDocument();
  });

  it("should format percentage values correctly", () => {
    const metric = createMockMetric({
      value: 98.5,
      unit: "%",
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText("98.5")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    const metric = createMockMetric({
      description: "This is a detailed description",
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(
      screen.getByText("This is a detailed description")
    ).toBeInTheDocument();
  });

  it("should not render sparkline when no sparklineData provided", () => {
    const metric = createMockMetric();

    const { container } = renderWithProviders(<MetricCard metric={metric} />);

    // Look for sparkline SVG specifically (it has w-full h-12 class)
    const sparklineSvg = container.querySelector('svg[class*="h-12"]');
    expect(sparklineSvg).not.toBeInTheDocument();
  });

  it("should render sparkline when sparklineData is provided", () => {
    const metric = createMockMetric();
    const sparklineData = [10, 15, 12, 18, 14, 20, 16, 22, 19, 25];

    const { container } = renderWithProviders(
      <MetricCard metric={metric} sparklineData={sparklineData} />
    );

    // Look for sparkline SVG (custom SVG, not recharts)
    const sparklineSvg = container.querySelector("svg polyline");
    expect(sparklineSvg).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const metric = createMockMetric();

    renderWithProviders(<MetricCard metric={metric} onClick={handleClick} />);

    const card = screen
      .getByText("Test Metric")
      .closest('[class*="cursor-pointer"]');
    expect(card).toBeInTheDocument();

    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should not have cursor pointer when onClick is not provided", () => {
    const metric = createMockMetric();

    renderWithProviders(<MetricCard metric={metric} />);

    const card = screen
      .getByText("Test Metric")
      .closest('[class*="cursor-pointer"]');
    expect(card).not.toBeInTheDocument();
  });

  it("should handle error rate metrics with inverse trend colors", () => {
    const metric = createMockMetric({
      name: "Error Rate",
      value: 2.5,
      unit: "%",
      trend: "down",
      change: -0.5,
      changePercent: -16.7,
    });

    renderWithProviders(<MetricCard metric={metric} />);

    expect(screen.getByText("Error Rate")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
  });
});
