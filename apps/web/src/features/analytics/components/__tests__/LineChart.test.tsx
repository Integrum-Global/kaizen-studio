import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LineChart } from "../LineChart";
import type { TimeSeriesData } from "../../types";

describe("LineChart", () => {
  const mockData: TimeSeriesData[] = [
    { timestamp: "2024-01-01T00:00:00Z", value: 100 },
    { timestamp: "2024-01-02T00:00:00Z", value: 150 },
    { timestamp: "2024-01-03T00:00:00Z", value: 120 },
  ];

  it("renders without crashing", () => {
    const { container } = render(<LineChart data={mockData} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders with custom height", () => {
    const { container } = render(<LineChart data={mockData} height={400} />);
    const wrapper = container.querySelector(".recharts-wrapper");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders with custom color", () => {
    const { container } = render(
      <LineChart data={mockData} color="hsl(120, 100%, 50%)" />
    );
    expect(container.querySelector(".recharts-line")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<LineChart data={mockData} label="Custom Label" />);
    // Chart library renders label in the DOM
    expect(document.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders grid when showGrid is true", () => {
    const { container } = render(<LineChart data={mockData} showGrid={true} />);
    expect(
      container.querySelector(".recharts-cartesian-grid")
    ).toBeInTheDocument();
  });

  it("hides grid when showGrid is false", () => {
    const { container } = render(
      <LineChart data={mockData} showGrid={false} />
    );
    expect(
      container.querySelector(".recharts-cartesian-grid")
    ).not.toBeInTheDocument();
  });

  it("renders legend when showLegend is true", () => {
    const { container } = render(
      <LineChart data={mockData} showLegend={true} />
    );
    expect(
      container.querySelector(".recharts-legend-wrapper")
    ).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    const { container } = render(<LineChart data={[]} />);
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });
});
