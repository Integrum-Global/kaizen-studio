import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SkeletonList } from "../components/SkeletonList";

describe("SkeletonList", () => {
  it("renders default number of items", () => {
    const { container } = render(<SkeletonList />);
    const items = container.querySelectorAll('[class*="flex items-start"]');
    expect(items.length).toBe(5);
  });

  it("renders custom number of items", () => {
    const { container } = render(<SkeletonList items={3} />);
    const items = container.querySelectorAll('[class*="flex items-start"]');
    expect(items.length).toBe(3);
  });

  it("renders single item", () => {
    const { container } = render(<SkeletonList items={1} />);
    const items = container.querySelectorAll('[class*="flex items-start"]');
    expect(items.length).toBe(1);
  });

  it("shows avatar when showAvatar is true", () => {
    render(<SkeletonList items={3} showAvatar={true} />);
    const skeletons = screen.getAllByRole("status");
    // Each item has: 1 avatar + 1 primary + optional secondary
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it("hides avatar when showAvatar is false", () => {
    render(<SkeletonList items={3} showAvatar={false} />);
    const skeletons = screen.getAllByRole("status");
    // Only text skeletons, no avatars
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows secondary text when showSecondary is true", () => {
    render(<SkeletonList items={2} showSecondary={true} />);
    const skeletons = screen.getAllByRole("status");
    // Each item: avatar + primary + secondary
    expect(skeletons.length).toBe(6); // 2 items × 3 skeletons
  });

  it("hides secondary text when showSecondary is false", () => {
    render(<SkeletonList items={2} showSecondary={false} />);
    const skeletons = screen.getAllByRole("status");
    // Each item: avatar + primary only
    expect(skeletons.length).toBe(4); // 2 items × 2 skeletons
  });

  it("renders without avatar and secondary", () => {
    render(<SkeletonList items={2} showAvatar={false} showSecondary={false} />);
    const skeletons = screen.getAllByRole("status");
    // Only primary text
    expect(skeletons.length).toBe(2);
  });

  it("disables animation when animate is false", () => {
    render(<SkeletonList animate={false} />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass("animate-pulse");
    });
  });

  it("enables animation by default", () => {
    render(<SkeletonList />);
    const skeletons = screen.getAllByRole("status");
    skeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  it("merges custom className", () => {
    const { container } = render(<SkeletonList className="custom-list" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-list");
  });

  it("has proper spacing between items", () => {
    const { container } = render(<SkeletonList />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-4");
  });

  it("avatars are circular", () => {
    render(<SkeletonList items={1} showAvatar={true} />);
    const skeletons = screen.getAllByRole("status");
    const avatar = skeletons[0];
    expect(avatar).toHaveClass("rounded-full");
  });

  it("renders many items correctly", () => {
    const { container } = render(<SkeletonList items={10} />);
    const items = container.querySelectorAll('[class*="flex items-start"]');
    expect(items.length).toBe(10);
  });

  it("each item has flex layout with gap", () => {
    const { container } = render(<SkeletonList items={2} />);
    const items = container.querySelectorAll('[class*="flex items-start"]');
    items.forEach((item) => {
      expect(item).toHaveClass("gap-4");
    });
  });
});
