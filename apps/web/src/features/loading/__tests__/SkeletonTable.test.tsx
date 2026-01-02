import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkeletonTable } from "../components/SkeletonTable";

describe("SkeletonTable", () => {
  it("renders with default props", () => {
    render(<SkeletonTable />);
    const skeletons = screen.getAllByRole("status");
    // Default: 5 rows × 4 columns + 4 header cells = 24 skeletons
    expect(skeletons.length).toBe(24);
  });

  it("renders correct number of rows", () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const tableRows = container.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(3);
  });

  it("renders correct number of columns", () => {
    const { container } = render(<SkeletonTable columns={5} />);
    const firstRow = container.querySelector("tbody tr");
    const cells = firstRow?.querySelectorAll("td");
    expect(cells?.length).toBe(5);
  });

  it("shows header when showHeader is true", () => {
    const { container } = render(<SkeletonTable showHeader={true} />);
    const header = container.querySelector("thead");
    expect(header).toBeInTheDocument();
  });

  it("hides header when showHeader is false", () => {
    const { container } = render(<SkeletonTable showHeader={false} />);
    const header = container.querySelector("thead");
    expect(header).not.toBeInTheDocument();
  });

  it("renders header cells equal to columns", () => {
    const { container } = render(
      <SkeletonTable columns={6} showHeader={true} />
    );
    const headerCells = container.querySelectorAll("thead th");
    expect(headerCells.length).toBe(6);
  });

  it("disables animation when animate is false", () => {
    render(<SkeletonTable animate={false} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass("animate-pulse");
    });
  });

  it("enables animation by default", () => {
    render(<SkeletonTable />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  it("merges custom className", () => {
    const { container } = render(<SkeletonTable className="custom-table" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-table");
  });

  it("renders large table", () => {
    const { container } = render(<SkeletonTable rows={10} columns={8} />);
    const tableRows = container.querySelectorAll("tbody tr");
    const firstRow = container.querySelector("tbody tr");
    const cells = firstRow?.querySelectorAll("td");
    expect(tableRows.length).toBe(10);
    expect(cells?.length).toBe(8);
  });

  it("renders minimal table", () => {
    const { container } = render(
      <SkeletonTable rows={1} columns={1} showHeader={false} />
    );
    const tableRows = container.querySelectorAll("tbody tr");
    const cells = container.querySelectorAll("tbody td");
    expect(tableRows.length).toBe(1);
    expect(cells.length).toBe(1);
  });

  it("has proper table structure", () => {
    const { container } = render(<SkeletonTable />);
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  it("has border and rounded styling", () => {
    const { container } = render(<SkeletonTable />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("border", "rounded-lg");
  });
});
