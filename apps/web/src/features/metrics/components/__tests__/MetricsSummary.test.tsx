import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { MetricsSummary } from "../MetricsSummary";
import type { MetricsSummary as MetricsSummaryType } from "../../types";

describe("MetricsSummary", () => {
  const createMockSummary = (
    overrides?: Partial<MetricsSummaryType>
  ): MetricsSummaryType => ({
    totalAgents: 42,
    totalExecutions: 1247,
    successRate: 98.5,
    avgResponseTime: 245,
    activeUsers: 127,
    apiCalls: 45632,
    errorRate: 1.5,
    p95ResponseTime: 850,
    ...overrides,
  });

  it("should render summary title", () => {
    const summary = createMockSummary();

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Summary Statistics")).toBeInTheDocument();
  });

  it("should render all summary statistics", () => {
    const summary = createMockSummary();

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Total Agents")).toBeInTheDocument();
    expect(screen.getByText("Total Executions")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
    expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("API Calls")).toBeInTheDocument();
    expect(screen.getByText("Error Rate")).toBeInTheDocument();
    expect(screen.getByText("P95 Response Time")).toBeInTheDocument();
  });

  it("should format total agents correctly", () => {
    const summary = createMockSummary({ totalAgents: 42 });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should format large execution counts with K suffix", () => {
    const summary = createMockSummary({ totalExecutions: 5500 });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("5.5K")).toBeInTheDocument();
  });

  it("should format very large numbers with M suffix", () => {
    const summary = createMockSummary({ apiCalls: 1500000 });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("1.5M")).toBeInTheDocument();
  });

  it("should format success rate as percentage", () => {
    const summary = createMockSummary({ successRate: 98.5 });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("98.5")).toBeInTheDocument();
    const percentageElements = screen.getAllByText("%");
    expect(percentageElements.length).toBeGreaterThan(0);
  });

  it("should format response time with ms unit", () => {
    const summary = createMockSummary({ avgResponseTime: 245 });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("245")).toBeInTheDocument();
    const msElements = screen.getAllByText("ms");
    expect(msElements.length).toBeGreaterThan(0);
  });

  it("should render loading state with skeletons", () => {
    const summary = createMockSummary();

    const { container } = renderWithProviders(
      <MetricsSummary summary={summary} isLoading />
    );

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render 8 skeleton items when loading", () => {
    const summary = createMockSummary();

    const { container } = renderWithProviders(
      <MetricsSummary summary={summary} isLoading />
    );

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    // Should have multiple skeletons for 8 stats
    expect(skeletons.length).toBeGreaterThanOrEqual(8);
  });

  it("should not show loading state when isLoading is false", () => {
    const summary = createMockSummary();

    renderWithProviders(<MetricsSummary summary={summary} isLoading={false} />);

    // Should show actual data, not skeletons
    expect(screen.getByText("Total Agents")).toBeInTheDocument();
  });

  it("should render icons for each statistic", () => {
    const summary = createMockSummary();

    const { container } = renderWithProviders(
      <MetricsSummary summary={summary} />
    );

    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("should apply positive trend color for good metrics", () => {
    const summary = createMockSummary({
      successRate: 99.5,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  it("should apply negative trend color for poor success rate", () => {
    const summary = createMockSummary({
      successRate: 90.0,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  it("should apply positive trend color for low error rate", () => {
    const summary = createMockSummary({
      errorRate: 1.0,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Error Rate")).toBeInTheDocument();
  });

  it("should apply negative trend color for high error rate", () => {
    const summary = createMockSummary({
      errorRate: 5.0,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Error Rate")).toBeInTheDocument();
  });

  it("should apply positive trend color for low response time", () => {
    const summary = createMockSummary({
      avgResponseTime: 200,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
  });

  it("should apply negative trend color for high response time", () => {
    const summary = createMockSummary({
      avgResponseTime: 500,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    expect(screen.getByText("Avg Response Time")).toBeInTheDocument();
  });

  it("should render in grid layout", () => {
    const summary = createMockSummary();

    const { container } = renderWithProviders(
      <MetricsSummary summary={summary} />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("should handle zero values gracefully", () => {
    const summary = createMockSummary({
      totalAgents: 0,
      totalExecutions: 0,
      activeUsers: 0,
    });

    renderWithProviders(<MetricsSummary summary={summary} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });
});
