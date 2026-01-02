import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "../components/Skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toBeInTheDocument();
  });

  it("has accessibility attributes", () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("aria-live", "polite");
  });

  it("includes screen reader text", () => {
    render(<Skeleton />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("applies animation by default", () => {
    render(<Skeleton />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("animate-pulse");
  });

  it("can disable animation", () => {
    render(<Skeleton animate={false} />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).not.toHaveClass("animate-pulse");
  });

  it("applies variant styles - text", () => {
    render(<Skeleton variant="text" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("h-4", "w-full", "rounded");
  });

  it("applies variant styles - circular", () => {
    render(<Skeleton variant="circular" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("applies variant styles - rectangular", () => {
    render(<Skeleton variant="rectangular" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("rounded-md");
  });

  it("applies variant styles - rounded", () => {
    render(<Skeleton variant="rounded" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("rounded-lg");
  });

  it("accepts custom width and height as numbers", () => {
    render(<Skeleton width={200} height={100} />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveStyle({
      width: "200px",
      height: "100px",
    });
  });

  it("accepts custom width and height as strings", () => {
    render(<Skeleton width="50%" height="2rem" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveStyle({
      width: "50%",
      height: "2rem",
    });
  });

  it("merges custom className", () => {
    render(<Skeleton className="custom-class" />);
    const skeleton = screen.getByRole("status");
    expect(skeleton).toHaveClass("custom-class");
    expect(skeleton).toHaveClass("bg-muted");
  });

  it("forwards additional props", () => {
    render(<Skeleton data-testid="custom-skeleton" />);
    expect(screen.getByTestId("custom-skeleton")).toBeInTheDocument();
  });
});
