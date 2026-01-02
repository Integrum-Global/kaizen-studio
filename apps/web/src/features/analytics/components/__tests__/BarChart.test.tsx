import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BarChart } from "../BarChart";
import type { ChartData, CategoryData } from "../../types";

describe("BarChart", () => {
  const mockChartData: ChartData = {
    labels: ["A", "B", "C"],
    datasets: [
      { label: "Series 1", data: [10, 20, 30], color: "hsl(0, 100%, 50%)" },
      { label: "Series 2", data: [15, 25, 35], color: "hsl(120, 100%, 50%)" },
    ],
  };

  const mockCategoryData: CategoryData[] = [
    { name: "Category A", value: 100, percentage: 50 },
    { name: "Category B", value: 100, percentage: 50 },
  ];

  it("renders with ChartData format", () => {
    const { container } = render(<BarChart data={mockChartData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders with CategoryData format", () => {
    const { container } = render(<BarChart data={mockCategoryData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    const { container } = render(
      <BarChart data={mockChartData} height={400} />
    );
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders vertical layout by default", () => {
    const { container } = render(<BarChart data={mockChartData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders horizontal layout when specified", () => {
    const { container } = render(
      <BarChart data={mockChartData} layout="horizontal" />
    );
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders grid when showGrid is true", () => {
    const { container } = render(
      <BarChart data={mockChartData} showGrid={true} />
    );
    expect(
      container.querySelector(".recharts-cartesian-grid")
    ).toBeInTheDocument();
  });

  it("hides grid when showGrid is false", () => {
    const { container } = render(
      <BarChart data={mockChartData} showGrid={false} />
    );
    expect(
      container.querySelector(".recharts-cartesian-grid")
    ).not.toBeInTheDocument();
  });

  it("renders legend when showLegend is true", () => {
    const { container } = render(
      <BarChart data={mockChartData} showLegend={true} />
    );
    expect(
      container.querySelector(".recharts-legend-wrapper")
    ).toBeInTheDocument();
  });

  it("handles multiple datasets", () => {
    const { container } = render(<BarChart data={mockChartData} />);
    const bars = container.querySelectorAll(".recharts-bar");
    expect(bars.length).toBeGreaterThan(0);
  });
});
