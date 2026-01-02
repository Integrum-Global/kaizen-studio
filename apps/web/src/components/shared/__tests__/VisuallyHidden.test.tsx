import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VisuallyHidden } from "../VisuallyHidden";

describe("VisuallyHidden", () => {
  it("should render children content", () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    expect(screen.getByText("Hidden text")).toBeInTheDocument();
  });

  it("should render as span by default", () => {
    const { container } = render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    const element = container.querySelector("span");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("Hidden text");
  });

  it("should render as div when specified", () => {
    const { container } = render(
      <VisuallyHidden as="div">Hidden text</VisuallyHidden>
    );
    const element = container.querySelector("div");
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent("Hidden text");
  });

  it("should apply screen reader only classes", () => {
    const { container } = render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    const element = container.querySelector("span");
    expect(element).toHaveClass("absolute");
    expect(element).toHaveClass("w-px");
    expect(element).toHaveClass("h-px");
    expect(element).toHaveClass("overflow-hidden");
    expect(element).toHaveClass("whitespace-nowrap");
  });

  it("should accept custom className", () => {
    const { container } = render(
      <VisuallyHidden className="custom-class">Hidden text</VisuallyHidden>
    );
    const element = container.querySelector("span");
    expect(element).toHaveClass("custom-class");
    // Should still have base classes
    expect(element).toHaveClass("absolute");
  });

  it("should be accessible to screen readers", () => {
    render(<VisuallyHidden>Screen reader only text</VisuallyHidden>);
    // Content should be in the document (accessible)
    expect(screen.getByText("Screen reader only text")).toBeInTheDocument();
  });

  it("should render complex children", () => {
    render(
      <VisuallyHidden>
        <span>Complex</span> <strong>children</strong>
      </VisuallyHidden>
    );
    expect(screen.getByText("Complex")).toBeInTheDocument();
    expect(screen.getByText("children")).toBeInTheDocument();
  });
});
