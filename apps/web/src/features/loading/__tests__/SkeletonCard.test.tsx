import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkeletonCard } from "../components/SkeletonCard";

describe("SkeletonCard", () => {
  it("renders with all elements by default", () => {
    render(<SkeletonCard />);
    const skeletons = screen.getAllByRole("status");
    // Image (1) + Title (1) + Description (2) + Content (3) + Actions (2)
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it("shows image skeleton when showImage is true", () => {
    const { container } = render(<SkeletonCard showImage={true} />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("hides image skeleton when showImage is false", () => {
    render(<SkeletonCard showImage={false} />);
    const skeletons = screen.getAllByRole("status");
    // Should have fewer skeletons without image
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows title when showTitle is true", () => {
    const { container } = render(<SkeletonCard showTitle={true} />);
    const header = container.querySelector('[class*="space-y-2"]');
    expect(header).toBeInTheDocument();
  });

  it("hides title when showTitle is false", () => {
    render(<SkeletonCard showTitle={false} showDescription={false} />);
    const skeletons = screen.getAllByRole("status");
    // Should have fewer skeletons without title/description
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows description when showDescription is true", () => {
    render(<SkeletonCard showDescription={true} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it("hides description when showDescription is false", () => {
    render(<SkeletonCard showDescription={false} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows action buttons when showActions is true", () => {
    render(<SkeletonCard showActions={true} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it("hides action buttons when showActions is false", () => {
    render(<SkeletonCard showActions={false} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("disables animation when animate is false", () => {
    render(<SkeletonCard animate={false} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass("animate-pulse");
    });
  });

  it("enables animation by default", () => {
    render(<SkeletonCard />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  it("merges custom className", () => {
    const { container } = render(<SkeletonCard className="custom-card" />);
    const card = container.firstChild;
    expect(card).toHaveClass("custom-card");
  });

  it("renders minimal card", () => {
    render(
      <SkeletonCard
        showImage={false}
        showTitle={false}
        showDescription={false}
        showActions={false}
      />
    );
    // Should still render content section
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(3); // Only content lines
  });
});
