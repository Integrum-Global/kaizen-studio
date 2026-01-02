import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendIndicator } from "../TrendIndicator";

describe("TrendIndicator", () => {
  it("renders positive trend correctly", () => {
    render(<TrendIndicator value={12.5} />);
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
  });

  it("renders negative trend correctly", () => {
    render(<TrendIndicator value={-8.3} />);
    expect(screen.getByText("8.3%")).toBeInTheDocument();
  });

  it("renders neutral trend correctly", () => {
    render(<TrendIndicator value={0} />);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("renders without sign when showSign is false", () => {
    render(<TrendIndicator value={12.5} showSign={false} />);
    expect(screen.getByText("12.5%")).toBeInTheDocument();
  });

  it("renders with custom suffix", () => {
    render(<TrendIndicator value={12.5} suffix="pts" />);
    expect(screen.getByText("+12.5pts")).toBeInTheDocument();
  });

  it("auto-detects up trend from positive value", () => {
    const { container } = render(<TrendIndicator value={12.5} />);
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
  });

  it("auto-detects down trend from negative value", () => {
    const { container } = render(<TrendIndicator value={-8.3} />);
    expect(container.querySelector(".text-red-600")).toBeInTheDocument();
  });

  it("respects explicit trend prop", () => {
    const { container } = render(<TrendIndicator value={12.5} trend="down" />);
    expect(container.querySelector(".text-red-600")).toBeInTheDocument();
  });

  it("hides icon when showIcon is false", () => {
    const { container } = render(
      <TrendIndicator value={12.5} showIcon={false} />
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
