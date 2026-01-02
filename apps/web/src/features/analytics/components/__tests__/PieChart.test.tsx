import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PieChart } from "../PieChart";
import type { CategoryData } from "../../types";

describe("PieChart", () => {
  const mockData: CategoryData[] = [
    { name: "Category A", value: 100, percentage: 40 },
    { name: "Category B", value: 75, percentage: 30 },
    { name: "Category C", value: 50, percentage: 20 },
    { name: "Category D", value: 25, percentage: 10 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<PieChart data={mockData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    const { container } = render(<PieChart data={mockData} height={400} />);
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders as donut chart with innerRadius", () => {
    const { container } = render(<PieChart data={mockData} innerRadius={60} />);
    expect(container.querySelector(".recharts-pie")).toBeInTheDocument();
  });

  it("renders legend when showLegend is true", () => {
    const { container } = render(
      <PieChart data={mockData} showLegend={true} />
    );
    expect(
      container.querySelector(".recharts-legend-wrapper")
    ).toBeInTheDocument();
  });

  it("hides legend when showLegend is false", () => {
    const { container } = render(
      <PieChart data={mockData} showLegend={false} />
    );
    expect(
      container.querySelector(".recharts-legend-wrapper")
    ).not.toBeInTheDocument();
  });

  it("renders with custom colors", () => {
    const customColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
    const { container } = render(
      <PieChart data={mockData} colors={customColors} />
    );
    expect(container.querySelector(".recharts-pie")).toBeInTheDocument();
  });

  it("handles single data point", () => {
    const singleData: CategoryData[] = [
      { name: "Only One", value: 100, percentage: 100 },
    ];
    const { container } = render(<PieChart data={singleData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders pie sectors", () => {
    const { container } = render(<PieChart data={mockData} />);
    const sectors = container.querySelectorAll(".recharts-pie-sector");
    expect(sectors.length).toBeGreaterThan(0);
  });
});
