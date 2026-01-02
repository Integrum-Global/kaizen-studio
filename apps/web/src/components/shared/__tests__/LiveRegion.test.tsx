import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveRegion } from "../LiveRegion";

describe("LiveRegion", () => {
  it("should render children content", () => {
    render(<LiveRegion>Loading...</LiveRegion>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should have role of status", () => {
    render(<LiveRegion>Status update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent("Status update");
  });

  it("should have default aria-live of polite", () => {
    render(<LiveRegion>Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });

  it("should accept custom politeness level", () => {
    render(<LiveRegion politeness="assertive">Urgent update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("should support off politeness level", () => {
    render(<LiveRegion politeness="off">Silent update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "off");
  });

  it("should have default aria-atomic of true", () => {
    render(<LiveRegion>Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("should accept custom atomic value", () => {
    render(<LiveRegion atomic={false}>Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-atomic", "false");
  });

  it("should have default aria-relevant of additions", () => {
    render(<LiveRegion>Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-relevant", "additions");
  });

  it("should accept custom relevant value", () => {
    render(<LiveRegion relevant="all">Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-relevant", "all");
  });

  it("should have sr-only class by default", () => {
    render(<LiveRegion>Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveClass("sr-only");
  });

  it("should accept custom className", () => {
    render(<LiveRegion className="custom-class">Update</LiveRegion>);
    const region = screen.getByRole("status");
    expect(region).toHaveClass("custom-class");
    // Should still have sr-only
    expect(region).toHaveClass("sr-only");
  });

  it("should support different relevant values", () => {
    const { rerender } = render(
      <LiveRegion relevant="additions">Add</LiveRegion>
    );
    let region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-relevant", "additions");

    rerender(<LiveRegion relevant="removals">Remove</LiveRegion>);
    region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-relevant", "removals");

    rerender(<LiveRegion relevant="text">Text</LiveRegion>);
    region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-relevant", "text");
  });

  it("should render complex children", () => {
    render(
      <LiveRegion>
        <span>Loading</span> <strong>data</strong>...
      </LiveRegion>
    );
    expect(screen.getByText("Loading")).toBeInTheDocument();
    expect(screen.getByText("data")).toBeInTheDocument();
  });
});
