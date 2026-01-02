import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsCard, AnalyticsCardSkeleton } from "../AnalyticsCard";

describe("AnalyticsCard", () => {
  it("renders title and children", () => {
    render(
      <AnalyticsCard title="Test Title">
        <div>Test Content</div>
      </AnalyticsCard>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <AnalyticsCard title="Test Title" description="Test Description">
        <div>Content</div>
      </AnalyticsCard>
    );

    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders action element when provided", () => {
    render(
      <AnalyticsCard title="Test Title" action={<button>Action</button>}>
        <div>Content</div>
      </AnalyticsCard>
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AnalyticsCard title="Test" className="custom-class">
        <div>Content</div>
      </AnalyticsCard>
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});

describe("AnalyticsCardSkeleton", () => {
  it("renders skeleton loading state", () => {
    const { container } = render(<AnalyticsCardSkeleton />);

    // Check for skeleton elements
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
