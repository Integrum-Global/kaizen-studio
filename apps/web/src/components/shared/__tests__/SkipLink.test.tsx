import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipLink } from "../SkipLink";

describe("SkipLink", () => {
  it("should render with default text", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link).toBeInTheDocument();
  });

  it("should render with custom text", () => {
    render(<SkipLink>Skip to content</SkipLink>);
    const link = screen.getByText("Skip to content");
    expect(link).toBeInTheDocument();
  });

  it("should have default href of #main-content", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("should accept custom href", () => {
    render(<SkipLink href="#custom-target">Skip</SkipLink>);
    const link = screen.getByText("Skip");
    expect(link).toHaveAttribute("href", "#custom-target");
  });

  it("should have sr-only class for screen reader only visibility", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link).toHaveClass("sr-only");
  });

  it("should have focus styles for keyboard navigation", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    // Check for focus-related classes
    expect(link).toHaveClass("focus:not-sr-only");
    expect(link).toHaveClass("focus:absolute");
    expect(link).toHaveClass("focus:z-50");
  });

  it("should accept custom className", () => {
    render(<SkipLink className="custom-class">Skip</SkipLink>);
    const link = screen.getByText("Skip");
    expect(link).toHaveClass("custom-class");
    // Should still have base classes
    expect(link).toHaveClass("sr-only");
  });

  it("should be an anchor element", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    expect(link.tagName).toBe("A");
  });

  it("should have proper focus styles for accessibility", () => {
    render(<SkipLink />);
    const link = screen.getByText("Skip to main content");
    // Verify focus ring styles are present
    expect(link).toHaveClass("focus:ring-2");
    expect(link).toHaveClass("focus:ring-ring");
    expect(link).toHaveClass("focus:ring-offset-2");
  });

  it("should render complex children", () => {
    render(
      <SkipLink>
        <span>Skip</span> to <strong>content</strong>
      </SkipLink>
    );
    expect(screen.getByText("Skip")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});
