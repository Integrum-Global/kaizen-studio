import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Show } from "../components/Show";

// Mock the useBreakpoint hook
vi.mock("../hooks/useBreakpoint", () => ({
  useBreakpoint: vi.fn(),
}));

import { useBreakpoint } from "../hooks/useBreakpoint";

describe("Show", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show children on mobile when on='mobile'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Show on="mobile">
        <div>Mobile content</div>
      </Show>
    );

    expect(screen.getByText("Mobile content")).toBeInTheDocument();
  });

  it("should hide children on tablet when on='mobile'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Show on="mobile">
        <div>Mobile content</div>
      </Show>
    );

    expect(screen.queryByText("Mobile content")).not.toBeInTheDocument();
  });

  it("should show children on tablet when on='tablet'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Show on="tablet">
        <div>Tablet content</div>
      </Show>
    );

    expect(screen.getByText("Tablet content")).toBeInTheDocument();
  });

  it("should show children on desktop when on='desktop'", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Show on="desktop">
        <div>Desktop content</div>
      </Show>
    );

    expect(screen.getByText("Desktop content")).toBeInTheDocument();
  });

  it("should show children on mobile or tablet when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Show on={["mobile", "tablet"]}>
        <div>Mobile and tablet content</div>
      </Show>
    );

    expect(screen.getByText("Mobile and tablet content")).toBeInTheDocument();
  });

  it("should show children on tablet when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Show on={["mobile", "tablet"]}>
        <div>Mobile and tablet content</div>
      </Show>
    );

    expect(screen.getByText("Mobile and tablet content")).toBeInTheDocument();
  });

  it("should hide children on desktop when on=['mobile', 'tablet']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Show on={["mobile", "tablet"]}>
        <div>Mobile and tablet content</div>
      </Show>
    );

    expect(
      screen.queryByText("Mobile and tablet content")
    ).not.toBeInTheDocument();
  });

  it("should show children on all breakpoints when on=['mobile', 'tablet', 'desktop']", () => {
    const breakpoints = [
      {
        breakpoint: "mobile" as const,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      },
      {
        breakpoint: "tablet" as const,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      },
      {
        breakpoint: "desktop" as const,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      },
    ];

    breakpoints.forEach((bp) => {
      vi.mocked(useBreakpoint).mockReturnValue(bp);

      const { unmount } = render(
        <Show on={["mobile", "tablet", "desktop"]}>
          <div>All breakpoints content</div>
        </Show>
      );

      expect(screen.getByText("All breakpoints content")).toBeInTheDocument();
      unmount();
    });
  });

  it("should handle complex children elements", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    render(
      <Show on="desktop">
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      </Show>
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("should handle JSX fragments as children", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Show on="mobile">
        <>
          <div>First</div>
          <div>Second</div>
        </>
      </Show>
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("should show children on tablet and desktop when on=['tablet', 'desktop']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "tablet",
      isMobile: false,
      isTablet: true,
      isDesktop: false,
    });

    render(
      <Show on={["tablet", "desktop"]}>
        <div>Tablet and desktop content</div>
      </Show>
    );

    expect(screen.getByText("Tablet and desktop content")).toBeInTheDocument();
  });

  it("should hide children on mobile when on=['tablet', 'desktop']", () => {
    vi.mocked(useBreakpoint).mockReturnValue({
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    render(
      <Show on={["tablet", "desktop"]}>
        <div>Tablet and desktop content</div>
      </Show>
    );

    expect(
      screen.queryByText("Tablet and desktop content")
    ).not.toBeInTheDocument();
  });
});
