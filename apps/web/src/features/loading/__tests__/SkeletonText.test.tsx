import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkeletonText } from "../components/SkeletonText";

describe("SkeletonText", () => {
  it("renders default number of lines", () => {
    render(<SkeletonText />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(3);
  });

  it("renders custom number of lines", () => {
    render(<SkeletonText lines={5} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(5);
  });

  it("renders single line", () => {
    render(<SkeletonText lines={1} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(1);
  });

  it("applies small spacing", () => {
    const { container } = render(<SkeletonText spacing="sm" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-2");
  });

  it("applies medium spacing by default", () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-3");
  });

  it("applies large spacing", () => {
    const { container } = render(<SkeletonText spacing="lg" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-4");
  });

  it("makes last line shorter for realistic look", () => {
    render(<SkeletonText lines={3} />);
    const skeletons = screen.getAllByRole("status");
    const lastSkeleton = skeletons[skeletons.length - 1];
    // Last line should have 75% width
    expect(lastSkeleton).toHaveStyle({ width: "75%" });
  });

  it("first lines are full width", () => {
    render(<SkeletonText lines={3} />);
    const skeletons = screen.getAllByRole("status");
    const firstSkeleton = skeletons[0];
    expect(firstSkeleton).toHaveStyle({ width: "100%" });
  });

  it("disables animation when animate is false", () => {
    render(<SkeletonText animate={false} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass("animate-pulse");
    });
  });

  it("enables animation by default", () => {
    render(<SkeletonText />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  it("merges custom className", () => {
    const { container } = render(<SkeletonText className="custom-text" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-text");
  });

  it("renders many lines correctly", () => {
    render(<SkeletonText lines={10} />);
    const skeletons = screen.getAllByRole("status");
    expect(skeletons.length).toBe(10);
  });

  it("all lines have text variant styling", () => {
    render(<SkeletonText lines={3} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("h-4", "rounded");
    });
  });
});
